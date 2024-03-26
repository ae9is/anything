// Modified from: https://github.com/awslabs/lambda-streams-to-firehose

/*
AWS Streams to Firehose

Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

import { DynamoDBRecord, DynamoDBStreamEvent, StreamRecord } from 'aws-lambda'
import {
  FirehoseClient,
  PutRecordBatchCommand,
  PutRecordBatchCommandInput,
  PutRecordBatchCommandOutput,
  _Record,
} from '@aws-sdk/client-firehose'

import { notEmpty, stringify } from 'utils'
import * as pjson from '../../../../package.json'
import * as c from './constants'

const debug = process.env.DEBUG || false
const allEventTypes = ['INSERT', 'MODIFY', 'REMOVE']
const writableEventTypes = process.env.WRITABLE_EVENT_TYPES
  ? process.env.WRITABLE_EVENT_TYPES.split(',')
  : allEventTypes

/* Configure transform utility */
import * as transform from './transformer'

/*
 * create the transformer instance - change this to be regexToDelimter, or your
 * own new function
 */
let useTransformer: transform.TransformerFunction

export function setTransformer(transformer: transform.TransformerFunction) {
  useTransformer = transformer
}

/*
 * Configure destination router. By default all records route to the configured
 * stream
 */
import * as router from './router'

/*
 * create the routing rule reference that you want to use. This shows the
 * default router
 */
let useRouter = router.defaultRouting.bind(undefined)

export function setRouter(router: router.RoutingFunction) {
  useRouter = router
}

// example for using routing based on messages attributes
// var attributeMap = {
// "binaryValue" : {
// "true" : "TestRouting-route-A",
// "false" : "TestRouting-route-B"
// }
// };
// var useRouter = router.routeByAttributeMapping.bind(undefined, attributeMap);

export async function init(): Promise<FirehoseClient> {
  let firehoseClient: FirehoseClient
  let setRegion = process.env.AWS_REGION
  if (!setRegion) {
    setRegion = 'us-east-1'
    console.log('Warning: Setting default region ' + setRegion)
  }
  if (debug) {
    console.log('AWS Streams to Firehose Forwarder v' + pjson.version + ' in ' + setRegion)
  }
  useTransformer = await transform.setupTransformer()
  // Configure a new connection to firehose, if one has not been provided
  if (debug) {
    console.log('Connecting to Amazon Data Firehose in ' + setRegion)
  }
  firehoseClient = new FirehoseClient({
    region: setRegion,
  })
  return firehoseClient
}

// StreamRecord plus a couple attributes from DynamoDBRecord.
export type DynamoDBDataItem = StreamRecord & { eventName?: "INSERT" | "MODIFY" | "REMOVE", userIdentity?: any }

/**
 * Create a condensed version of a dynamodb change record.
 * This is returned as a base64 encoded Buffer so as to implement the same interface
 * used for transforming kinesis records
 */
export function createDynamoDataItem(record: DynamoDBRecord): DynamoDBDataItem {
  const output: DynamoDBDataItem = {}
  output.Keys = record?.dynamodb?.Keys
  if (record?.dynamodb?.NewImage) {
    output.NewImage = record.dynamodb.NewImage
  }
  if (record?.dynamodb?.OldImage) {
    output.OldImage = record.dynamodb.OldImage
  }
  // add the sequence number and other metadata
  output.SequenceNumber = record?.dynamodb?.SequenceNumber
  output.SizeBytes = record?.dynamodb?.SizeBytes
  output.ApproximateCreationDateTime = record?.dynamodb?.ApproximateCreationDateTime
  output.eventName = record.eventName
  // adding userIdentity, used by DynamoDB TTL to indicate removal by TTL as
  // opposed to user initiated remove
  output.userIdentity = record.userIdentity
  return output
}

/** function to extract the kinesis stream name from a kinesis stream ARN */
export function getStreamName(arn?: string) {
  try {
    if (!arn) {
      throw Error('No ARN passed')
    }
    const eventSourceARNTokens = arn.split(':')
    return eventSourceARNTokens[5].split('/')[1]
  } catch (e) {
    console.log('Malformed Kinesis Stream ARN')
    throw e
  }
}

export function onCompletion(context: any, err: string | null, status: string, message: string) {
  console.log('Processing Complete')
  if (err) {
    console.error(err)
  }
  // log the event if we've failed
  if (status !== c.OK) {
    if (message) {
      console.log(message)
    }
    // ensure that Lambda doesn't checkpoint to kinesis on error
    context.done(status, stringify(message))
  } else {
    context.done(null, message)
  }
}

export async function handler(event: DynamoDBStreamEvent, context: any) {
  // Add context to the function that closes the lambda invocation
  const finish = onCompletion.bind(undefined, context)
  if (debug) {
    console.log(stringify(event))
  }
  // Fail if wrong event source type is being sent, or if there is no data, etc
  let noProcessStatus = c.ERROR
  let noProcessReason
  let serviceName: string = ''
  if (!event?.Records || event?.Records?.length === 0) {
    // not fatal - just got an empty event
    noProcessReason = 'Event contains no Data'
    noProcessStatus = c.OK
  } else if (event?.Records?.[0]?.eventSource === c.DDB_SERVICE_NAME) {
    // there are records in this event
    serviceName = event.Records[0].eventSource
  } else {
    noProcessReason = 'Invalid Event Source ' + event.Records[0].eventSource
  }
  if (noProcessReason) {
    // terminate if there were any non process reasons
    finish(noProcessStatus, c.ERROR, noProcessReason)
  } else {
    try {
      const firehoseClient = await init()
      try {
        // parse the stream name out of the event
        const streamName = getStreamName(event.Records[0].eventSourceARN)
        // create the processor to handle each record
        const processor = processEvent.bind(
          undefined,
          event,
          serviceName,
          streamName,
          firehoseClient
        )
        try {
          const itemsToHandle = processor()
          finish(null, c.OK, 'Finished Processing Records')
        } catch (err) {
          finish(String(err), c.ERROR, 'Error Processing Records')
        }
      } catch (e) {
        finish(String(e), c.ERROR, 'Error Processing Records')
      }
    } catch (err) {
      finish(String(err), c.ERROR, 'Error')
    }
  }
}

export interface BatchItem {
  lowOffset: number
  highOffset: number
  sizeBytes: number
}

/**
 * Convenience function which generates the batch set with low and high offsets
 * for pushing data to Firehose in blocks of FIREHOSE_MAX_BATCH_COUNT and
 * staying within the FIREHOSE_MAX_BATCH_BYTES max payload size.
 * 
 * Batch ranges are calculated to be compatible with the array.slice() function which uses a
 * non-inclusive upper bound.
 */
export function getBatchRanges(records: Uint8Array[]): BatchItem[] {
  const batches = []
  let currentLowOffset = 0
  let batchCurrentBytes = 0
  let batchCurrentCount = 0
  let recordSize
  let nextRecordSize
  for (let i = 0; i < records.length; i++) {
    // need to calculate the total record size for the call to Firehose on
    // the basis of of non-base64 encoded values
    recordSize = Buffer.byteLength(records[i].toString(), c.targetEncoding)
    // batch always has 1 entry, so add it first
    batchCurrentBytes += recordSize
    batchCurrentCount += 1
    // To get next record size inorder to calculate the FIREHOSE_MAX_BATCH_BYTES
    if (i === records.length - 1) {
      nextRecordSize = 0
    } else {
      nextRecordSize = Buffer.byteLength(records[i + 1].toString(), c.targetEncoding)
    }
    // generate a new batch marker every 4MB or 500 records, whichever comes
    // first
    if (
      batchCurrentCount === c.FIREHOSE_MAX_BATCH_COUNT ||
      batchCurrentBytes + nextRecordSize > c.FIREHOSE_MAX_BATCH_BYTES ||
      i === records.length - 1
    ) {
      batches.push({
        lowOffset: currentLowOffset,
        // annoying special case handling for record sets of size 1
        highOffset: i + 1,
        sizeBytes: batchCurrentBytes,
      })
      // reset accumulators
      currentLowOffset = i + 1
      batchCurrentBytes = 0
      batchCurrentCount = 0
    }
  }
  return batches
}

/**
 * Process a stream event and generate requests to forward the embedded records to Firehose.
 * Before delivery, the user specified transformer will be invoked,
 * and the messages will be passed through a router which can determine the delivery stream dynamically if needed.
 */
export async function processEvent(
  event: DynamoDBStreamEvent,
  serviceName: string,
  streamName: string,
  firehoseClient: FirehoseClient
) {
  const itemsToHandle: DynamoDBDataItem[] = []
  if (debug) {
    console.log('Processing event')
  }
  // look up the delivery stream name of the mapping cache
  const deliveryStreamName = streamName
  if (debug) {
    console.log(
      'Forwarding ' +
        event.Records.length +
        ' ' +
        serviceName +
        ' records to Delivery Stream ' +
        deliveryStreamName
    )
  }
  for (const record of event.Records) {
    // dynamo update stream record
    if (record?.eventName && writableEventTypes.includes(record.eventName)) {
      if (debug) {
        console.log(
          'Processing record: ' +
            stringify(record) +
            ' with event type: ' +
            record.eventName +
            ' when writable events are: ' +
            writableEventTypes
        )
      }
      const item = createDynamoDataItem(record)
      itemsToHandle.push(item)
    } else {
      if (debug) {
        console.log(
          'Skipping record: ' +
            stringify(record) +
            ' with event type: ' +
            record.eventName +
            ' when writable events are: ' +
            writableEventTypes
        )
      }
    }
  }
  await handleResults(firehoseClient, streamName, itemsToHandle)
}

async function handleResults(
  firehoseClient: FirehoseClient,
  streamName: string,
  results?: DynamoDBDataItem[],
) {
  const extractedUserRecords = results ?? []
  // extractedUserRecords will be array[array[Object]], so flatten to array[Object]
  const userRecords: DynamoDBDataItem[] = extractedUserRecords.filter(notEmpty).flat()
  // transform the user records
  try {
    const transformed: Buffer[] = await transform.transformRecords(
      useTransformer,
      userRecords
    )
    if (transformed === undefined) {
      if (debug) {
        console.log('Nothing to route')
      }
      return
    }
    // apply the routing function that has been configured
    let routingDestinationMap: router.RoutingMap = {}
    try {
      routingDestinationMap = router.routeToDestination(
        streamName,
        transformed,
        useRouter,
      )
      // send the routed records to the delivery processor
      for (const destinationStream of Object.keys(routingDestinationMap)) {
        const records = routingDestinationMap[destinationStream]
        await processFinalRecords(
          firehoseClient,
          records,
          streamName,
          destinationStream
        )
      }
    } catch (err) {
      // we are still going to route to the default stream here,
      // as a bug in routing implementation cannot result in lost data!
      console.error(err)
      // discard the delivery map we might have received
      routingDestinationMap[streamName] = transformed
    }
  } catch (err) {
    console.error(err)
  }
}

/**
 * Forward a batch of records to a firehose delivery stream
 */
export async function writeToFirehose(
  firehoseClient: FirehoseClient,
  firehoseBatch: _Record[] | undefined,
  streamName: string,
  deliveryStreamName: string,
  retries?: number
) {
  let leftover: PutRecordBatchCommandOutput | undefined = undefined
  const numRetries = retries ?? 0
  // write the batch to firehose with putRecordBatch
  const putRecordBatchParams: PutRecordBatchCommandInput = {
    DeliveryStreamName: deliveryStreamName.substring(0, 64),
    Records: firehoseBatch,
  }
  if (debug) {
    console.log('Writing to firehose delivery stream (attempt ' + numRetries + ')')
    console.log(stringify(putRecordBatchParams))
  }
  const cmd = new PutRecordBatchCommand(putRecordBatchParams)
  try {
    if (debug) {
      console.log('Firehose client', firehoseClient)
      console.log('Cmd:', cmd)
      console.log('Sending cmd at: ' + new Date())
    }
    const startTime = new Date().getTime()

    // TODO FIXME causes process.exit
    const resp = await firehoseClient.send(cmd)

    const elapsedMs = new Date().getTime() - startTime
    if (debug) {
      console.log('Finished cmd at:' + new Date())
      const successCount = Math.max(0, (firehoseBatch?.length ?? 0) - (resp.FailedPutCount ?? 0))
      if (successCount > 0) {
        console.log(
          'Successfully wrote ' + successCount + ' records to Firehose ' + deliveryStreamName + ' in ' + elapsedMs + ' ms'
        )
      }
    }
    if (resp.FailedPutCount !== 0) {
      console.log(
        'Failed to write ' + resp.FailedPutCount + '/' + firehoseBatch?.length ??
          0 + ' records. Retrying to write...'
      )
      if (numRetries < c.MAX_RETRY_ON_FAILED_PUT) {
        // extract the failed records
        const failedBatch: _Record[] = []
        resp.RequestResponses?.map(function (item: any, index: number) {
          if (item.hasOwnProperty('ErrorCode') && firehoseBatch?.[index]) {
            failedBatch.push(firehoseBatch?.[index])
          }
        })
        const recurseWithFailed: () => Promise<PutRecordBatchCommandOutput | undefined> = writeToFirehose.bind(
          undefined,
          firehoseClient,
          failedBatch,
          streamName,
          deliveryStreamName,
          numRetries + 1
        )
        await new Promise(r => setTimeout(r, c.RETRY_INTERVAL_MS))
        return await recurseWithFailed()
      } else {
        console.log('Maximum retries reached, giving up')
        leftover = resp
      }
    }
  } catch (err) {
    console.log(stringify(err))
    throw err
  }
  return leftover
}

/**
 * Handle output of the defined transformation on each record.
 */
export async function processFinalRecords(
  firehoseClient: FirehoseClient,
  records: Uint8Array[],
  streamName: string,
  deliveryStreamName: string,
) {
  if (debug) {
    console.log('Delivering records to destination Streams')
  }
  // get the set of batch offsets based on the transformed record sizes
  const batches = getBatchRanges(records)
  if (debug) {
    console.log(stringify(batches))
  }
  // Push to Firehose using PutRecords API at max record count or size.
  // Want records from Kinesis to appear in the Firehose PutRecords request in the same order as they
  // were received by this function.
  let successCount = 0
  try {
    for (const item of batches) {
      if (debug) {
        console.log(
          'Forwarding records ' +
            item.lowOffset +
            ':' +
            item.highOffset +
            ' - ' +
            item.sizeBytes +
            ' Bytes'
        )
      }
      // grab subset of the records assigned for this batch and push to firehose
      const processRecords = records.slice(item.lowOffset, item.highOffset)
      // decorate the array for the Firehose API
      const decorated: _Record[] = []
      processRecords.map(function (item: Uint8Array | undefined) {
        decorated.push({
          Data: item,
        })
      })
      try {
        const resp = await writeToFirehose(
          firehoseClient,
          decorated,
          streamName,
          deliveryStreamName
        )
        successCount += 1
      } catch (err) {
        break
      }
    }
    console.log(
      'Event forwarding complete. Forwarded ' +
        successCount +
        ' batches comprising ' +
        records.length +
        ' records to Firehose ' +
        deliveryStreamName
    )
  } catch (err) {
    console.log('Forwarding failure after ' + successCount + ' successful batches')
  }
}
