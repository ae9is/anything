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

import * as deagg from 'aws-kinesis-agg'
import * as async from 'async'
import { DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda'
import { FirehoseClient, PutRecordBatchCommand, DescribeDeliveryStreamCommand } from '@aws-sdk/client-firehose'
import { KinesisClient, ListTagsForStreamCommand } from '@aws-sdk/client-kinesis'

import { notEmpty, stringify } from 'utils'
import * as pjson from '../../../../package.json'
import * as c from './constants'

const debug = process.env.DEBUG || false
const allEventTypes = ['INSERT', 'MODIFY', 'REMOVE']
const writableEventTypes = process.env.WRITABLE_EVENT_TYPES
  ? process.env.WRITABLE_EVENT_TYPES.split(',')
  : allEventTypes

let setRegion = process.env.AWS_REGION
export let firehose: FirehoseClient
export let kinesis: KinesisClient
let online = false

/* Configure transform utility */
import * as transform from './transformer'

/*
 * create the transformer instance - change this to be regexToDelimter, or your
 * own new function
 */
let useTransformer: any

export function setTransformer(transformer: any) {
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

export function setRouter(router: any) {
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

// should KPL checksums be calculated?
const computeChecksums = true

/*
 * If the source Kinesis Stream's tags or DynamoDB Stream Name don't resolve to
 * an existing Firehose, allow usage of a default delivery stream, or fail with
 * an error.
 */
const USE_DEFAULT_DELIVERY_STREAMS = true
/*
 * Delivery stream mappings can be specified here to overwrite values provided
 * by Kinesis Stream tags or DynamoDB stream name. (Helpful for debugging)
 * Format: DDBStreamName: deliveryStreamName Or: FORWARD_TO_FIREHOSE_STREAM tag
 * value: deliveryStreamName
 */
const deliveryStreamMapping: { [key: string]: string } = {
  DEFAULT: 'LambdaStreamsDefaultDeliveryStream',
}

export async function init(callback?: (args: any) => Promise<void>) {
  if (!online) {
    if (!setRegion || setRegion === null || setRegion === '') {
      setRegion = 'us-east-1'
      console.log('Warning: Setting default region ' + setRegion)
    }
    if (debug) {
      console.log('AWS Streams to Firehose Forwarder v' + pjson.version + ' in ' + setRegion)
    }
    transform.setupTransformer(async function (err: string, transformer: any) {
      if (err) {
        if (callback) {
          await callback(err)
        }
      } else {
        useTransformer = transformer
        // configure a new connection to firehose, if one has not been
        // provided
        if (!firehose) {
          if (debug) {
            console.log('Connecting to Amazon Kinesis Firehose in ' + setRegion)
          }
          firehose = new FirehoseClient({
            apiVersion: '2015-08-04',
            region: setRegion,
          })
        }
        // configure a new connection to kinesis streams, if one has not
        // been provided
        if (!kinesis) {
          if (debug) {
            console.log('Connecting to Amazon Kinesis Streams in ' + setRegion)
          }
          kinesis = new KinesisClient({
            apiVersion: '2013-12-02',
            region: setRegion,
          })
        }
        online = true
        if (callback) {
          await callback(null)
        }
      }
    })
  } else {
    if (callback) {
      await callback(null)
    }
  }
}

/**
 * Function to create a condensed version of a dynamodb change record. This is
 * returned as a base64 encoded Buffer so as to implement the same interface
 * used for transforming kinesis records
 */
export function createDynamoDataItem(record: any) {
  const output: any = {}
  output.Keys = record.dynamodb.Keys
  if (record.dynamodb.NewImage) {
    output.NewImage = record.dynamodb.NewImage
  }
  if (record.dynamodb.OldImage) {
    output.OldImage = record.dynamodb.OldImage
  }
  // add the sequence number and other metadata
  output.SequenceNumber = record.dynamodb.SequenceNumber
  output.SizeBytes = record.dynamodb.SizeBytes
  output.ApproximateCreationDateTime = record.dynamodb.ApproximateCreationDateTime
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

export function onCompletion(context: any, event: DynamoDBStreamEvent, err: string | null, status: string, message: string) {
  console.log('Processing Complete')
  if (err) {
    console.log(err)
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
  // add the context and event to the function that closes the lambda
  // invocation
  const finish = onCompletion.bind(undefined, context, event)
  /** End Runtime Functions */
  if (debug) {
    console.log(stringify(event))
  }
  // fail the function if the wrong event source type is being sent, or if
  // there is no data, etc
  let noProcessStatus = c.ERROR
  let noProcessReason
  let serviceName: string
  if (!event.Records || event.Records.length === 0) {
    noProcessReason = 'Event contains no Data'
    // not fatal - just got an empty event
    noProcessStatus = c.OK
  } else {
    // there are records in this event
    if (
      event.Records[0].eventSource === c.KINESIS_SERVICE_NAME ||
      event.Records[0].eventSource === c.DDB_SERVICE_NAME
    ) {
      serviceName = event.Records[0].eventSource
    } else {
      noProcessReason = 'Invalid Event Source ' + event.Records[0].eventSource
    }
    // currently hard coded around the 1.0 kinesis event schema
    // @ts-expect-error The typing for .kinesis isn't correct because it's an old record format
    if (event.Records[0]?.kinesis && event.Records[0]?.kinesis.kinesisSchemaVersion !== '1.0') {
      noProcessReason =
        // @ts-expect-error DynamoDBRecord.kinesis
        'Unsupported Kinesis Event Schema Version ' + event.Records[0]?.kinesis.kinesisSchemaVersion
    }
  }
  if (noProcessReason) {
    // terminate if there were any non process reasons
    finish(noProcessStatus, c.ERROR, noProcessReason)
  } else {
    init(async function (err: string) {
      if (err) {
        finish(err, c.ERROR, 'Error')
      } else {
        try {
          // parse the stream name out of the event
          const streamName = getStreamName(event.Records[0].eventSourceARN)
          // create the processor to handle each record
          const processor = processEvent.bind(
            undefined,
            event,
            serviceName,
            streamName,
            function (err: string) {
              if (err) {
                finish(err, c.ERROR, 'Error Processing Records')
              } else {
                finish(null, c.OK, 'Finished Processing Records')
              }
            }
          )
          if (Object.keys(deliveryStreamMapping).length === 0 || !streamName || !deliveryStreamMapping[streamName]) {
            // no delivery stream cached so far, so add this stream's
            // tag
            // value
            // to the delivery map, and continue with processEvent
            await buildDeliveryMap(streamName, serviceName, context, event, processor)
          } else {
            // delivery stream is cached so just invoke the processor
            processor()
          }
        } catch (e) {
          finish(String(e), c.ERROR, 'Error Processing Records')
        }
      }
    })
  }
}

/**
 * Function which resolves the destination delivery stream for a given Kinesis
 * stream. If no delivery stream is found to deliver to, then we will cache the
 * default delivery stream
 *
 * @param streamName
 * @param shouldFailbackToDefaultDeliveryStream
 * @param event
 * @param callback
 * @returns
 */
export async function verifyDeliveryStreamMapping(
  streamName: string,
  shouldFailbackToDefaultDeliveryStream: boolean,
  context: any,
  event: any,
  callback: (args?: any) => void,
) {
  if (debug) {
    console.log('Verifying delivery stream')
  }
  if (!deliveryStreamMapping[streamName]) {
    if (shouldFailbackToDefaultDeliveryStream) {
      /*
       * No delivery stream has been specified, probably as it's not
       * configured in stream tags. Using default delivery stream. To
       * prevent accidental forwarding of streams to a firehose set
       * USE_DEFAULT_DELIVERY_STREAMS = false.
       */
      deliveryStreamMapping[streamName] = deliveryStreamMapping['DEFAULT']
    } else {
      /*
       * Fail as no delivery stream mapping has been specified and we have
       * not configured to use a default. Kinesis Streams should be tagged
       * with ForwardToFirehoseStream = <DeliveryStreamName>
       */
      onCompletion(
        context,
        event,
        null,
        c.ERROR,
        'Warning: Kinesis Stream ' +
          streamName +
          ' not tagged for Firehose delivery with Tag name ' +
          c.FORWARD_TO_FIREHOSE_STREAM
      )
    }
  }
  // validate the delivery stream name provided
  const params = {
    DeliveryStreamName: deliveryStreamMapping[streamName],
  }
  const cmd = new DescribeDeliveryStreamCommand(params)
  try {
    const resp = await firehose.send(cmd)
    // call the specified callback - should have
    // already
    // been prepared by the calling function
    callback()
  } catch (err) {
    if (shouldFailbackToDefaultDeliveryStream) {
      deliveryStreamMapping[streamName] = deliveryStreamMapping['DEFAULT']
      await verifyDeliveryStreamMapping(streamName, false, context, event, callback)
    } else {
      onCompletion(
        context,
        event,
        null,
        c.ERROR,
        'Could not find suitable delivery stream for ' +
          streamName +
          ' and the ' +
          'default delivery stream (' +
          deliveryStreamMapping['DEFAULT'] +
          ") either doesn't exist or is disabled."
      )
    }
  }
}

/**
 * Function which resolves the destination delivery stream from the specified
 * Kinesis Stream Name, using Tags attached to the Kinesis Stream
 */
export async function buildDeliveryMap(streamName: string, serviceName: string, context: any, event: any, callback: (args: any) => void) {
  if (debug) {
    console.log('Building delivery stream mapping')
  }
  if (deliveryStreamMapping[streamName]) {
    // A delivery stream has already been specified in configuration
    // This could be indicative of debug usage.
    await verifyDeliveryStreamMapping(streamName, false, context, event, callback)
  } else if (serviceName === c.DDB_SERVICE_NAME) {
    // dynamodb streams need the firehose delivery stream to match
    // the table name
    deliveryStreamMapping[streamName] = streamName
    await verifyDeliveryStreamMapping(
      streamName,
      USE_DEFAULT_DELIVERY_STREAMS,
      context,
      event,
      callback
    )
  } else {
    // get the delivery stream name from Kinesis tag
    const params = {
      StreamName: streamName,
    }
    const cmd = new ListTagsForStreamCommand(params)
    try {
      const resp = await kinesis.send(cmd)
      let shouldFailbackToDefaultDeliveryStream = USE_DEFAULT_DELIVERY_STREAMS
      // grab the tag value if it's the foreward_to_firehose
      // name item
      resp.Tags?.map(function (item: any) {
        if (item.Key === c.FORWARD_TO_FIREHOSE_STREAM) {
          /*
            * Disable fallback to a default delivery stream as a
            * FORWARD_TO_FIREHOSE_STREAM has been specifically set.
            */
          shouldFailbackToDefaultDeliveryStream = false
          deliveryStreamMapping[streamName] = item.Value
        }
      })
      await verifyDeliveryStreamMapping(
        streamName,
        shouldFailbackToDefaultDeliveryStream,
        context,
        event,
        callback
      )
    } catch (err) {
      onCompletion(context, event, String(err), c.ERROR, 'Unable to List Tags for Stream')
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
 * staying within the FIREHOSE_MAX_BATCH_BYTES max payload size. Batch ranges
 * are calculated to be compatible with the array.slice() function which uses a
 * non-inclusive upper bound
 */
export function getBatchRanges(records: any): BatchItem[] {
  const batches = []
  let currentLowOffset = 0
  let batchCurrentBytes = 0
  let batchCurrentCount = 0
  let recordSize
  let nextRecordSize
  for (let i = 0; i < records.length; i++) {
    // need to calculate the total record size for the call to Firehose on
    // the basis of of non-base64 encoded values
    recordSize = Buffer.byteLength(records[i].toString(c.targetEncoding), c.targetEncoding)
    // batch always has 1 entry, so add it first
    batchCurrentBytes += recordSize
    batchCurrentCount += 1
    // To get next record size inorder to calculate the FIREHOSE_MAX_BATCH_BYTES
    if (i === records.length - 1) {
      nextRecordSize = 0
    } else {
      nextRecordSize = Buffer.byteLength(records[i + 1].toString(c.targetEncoding), c.targetEncoding)
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
 * Function to process a stream event and generate requests to forward the
 * embedded records to Kinesis Firehose. Before delivery, the user specified
 * transformer will be invoked, and the messages will be passed through a router
 * which can determine the delivery stream dynamically if needed
 */
export function processEvent(event: DynamoDBStreamEvent, serviceName: string, streamName: string, callback: any) {
  if (debug) {
    console.log('Processing event')
  }
  // look up the delivery stream name of the mapping cache
  const deliveryStreamName = deliveryStreamMapping[streamName]
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
  async.map<DynamoDBRecord, deagg.UserRecord[], string>(
    event.Records,
    function (record: DynamoDBRecord, callback: (err?: string | null, result?: deagg.UserRecord[]) => void) {
      const recordCallback = callback
      // resolve the record data based on the service
      if (serviceName === c.KINESIS_SERVICE_NAME) {
        // run the record through the KPL deaggregator
        // @ts-expect-error DynamoDBRecord.kinesis
        deagg.deaggregateSync(record.kinesis, computeChecksums, function (err, userRecords) {
          // userRecords now has all the deaggregated user records, or
          // just the original record if no KPL aggregation is in use
          if (err) {
            recordCallback(err.message)
          } else {
            recordCallback(null, userRecords)
          }
        })
      } else {
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
          const data = createDynamoDataItem(record)
          recordCallback(null, data)
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
          recordCallback(null, undefined)
        }
      }
    },
    function (err?: string | null, results?: Array<deagg.UserRecord[] | undefined>) {
      const extractedUserRecords = results ?? []
      if (err) {
        callback(err)
      } else {
        // extractedUserRecords will be array[array[Object]], so
        // flatten to array[Object]
        const userRecords: deagg.UserRecord[] = extractedUserRecords.filter(notEmpty).flat()
        // transform the user records
        transform.transformRecords(
          serviceName,
          useTransformer,
          userRecords,
          function (err: string, transformed: any) {
            // apply the routing function that has been configured
            router.routeToDestination(
              deliveryStreamName,
              transformed,
              useRouter,
              function (err: string, routingDestinationMap: any) {
                if (err) {
                  // we are still going to route to the default stream
                  // here, as a bug in routing implementation cannot
                  // result in lost data!
                  console.log(err)
                  // discard the delivery map we might have received
                  routingDestinationMap[deliveryStreamName] = transformed
                }
                // send the routed records to the delivery processor
                async.map(
                  Object.keys(routingDestinationMap),
                  function (destinationStream: string, asyncCallback: any) {
                    const records = routingDestinationMap[destinationStream]
                    processFinalRecords(records, streamName, destinationStream, asyncCallback)
                  },
                  function (err?: string | null, results?: any[]) {
                    if (err) {
                      callback(err)
                    } else {
                      if (debug) {
                        results?.map(function (item: BatchItem) {
                          console.log(stringify(item))
                        })
                      }
                      callback()
                    }
                  }
                )
              }
            )
          }
        )
      }
    }
  )
}

/**
 * function which forwards a batch of kinesis records to a firehose delivery
 * stream
 */
export async function writeToFirehose(firehoseBatch: any, streamName: string, deliveryStreamName: string, callback: (args?: any) => void, retries?: number) {
  const numRetries = retries ?? 0
  // write the batch to firehose with putRecordBatch
  const putRecordBatchParams = {
    DeliveryStreamName: deliveryStreamName.substring(0, 64),
    Records: firehoseBatch,
  }
  if (debug) {
    console.log('Writing to firehose delivery stream (' + numRetries + ')')
    console.log(stringify(putRecordBatchParams))
  }
  const startTime = new Date().getTime()

  const cmd = new PutRecordBatchCommand(putRecordBatchParams)
  try { 
    const resp = await firehose.send(cmd)
    if (resp.FailedPutCount !== 0) {
      console.log(
        'Failed to write ' +
          resp.FailedPutCount +
          '/' +
          firehoseBatch.length +
          ' records. Retrying to write...'
      )
      if (numRetries < c.MAX_RETRY_ON_FAILED_PUT) {
        // extract the failed records
        const failedBatch: any[] = []
        resp.RequestResponses?.map(function (item: any, index: number) {
          if (item.hasOwnProperty('ErrorCode')) {
            failedBatch.push(firehoseBatch[index])
          }
        })
        setTimeout(
          await writeToFirehose.bind(
            undefined,
            failedBatch,
            streamName,
            deliveryStreamName,
            function (err) {
              if (err) {
                callback(err)
              } else {
                callback()
              }
            },
            numRetries + 1
          ),
          c.RETRY_INTERVAL_MS
        )
      } else {
        console.log('Maximum retries reached, giving up')
        callback(resp)
      }
    } else {
      if (debug) {
        const elapsedMs = new Date().getTime() - startTime
        console.log(
          'Successfully wrote ' +
            firehoseBatch.length +
            ' records to Firehose ' +
            deliveryStreamName +
            ' in ' +
            elapsedMs +
            ' ms'
        )
      }
      callback()
    }
  } catch (err) {
    console.log(stringify(err))
    callback(err)
  }
}

/**
 * function which handles the output of the defined transformation on each
 * record.
 */
export async function processFinalRecords(records: any, streamName: string, deliveryStreamName: string, callback: any) {
  if (debug) {
    console.log('Delivering records to destination Streams')
  }
  // get the set of batch offsets based on the transformed record sizes
  const batches = getBatchRanges(records)
  if (debug) {
    console.log(stringify(batches))
  }
  // push to Firehose using PutRecords API at max record count or size.
  // This uses the async reduce method so that records from Kinesis will
  // appear in the Firehose PutRecords request in the same order as they
  // were received by this function
  async.reduce(
    batches,
    0,
    async function (memo: number | undefined, item: BatchItem, callback: async.AsyncResultCallback<number, any>) {
      const successCount = memo ?? 0
      const reduceCallback = callback
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
      // grab subset of the records assigned for this batch and push to
      // firehose
      const processRecords = records.slice(item.lowOffset, item.highOffset)
      // decorate the array for the Firehose API
      const decorated: any[] = []
      processRecords.map(function (item: any) {
        decorated.push({
          Data: new TextEncoder().encode(stringify(item)),
        })
      })
      await writeToFirehose(decorated, streamName, deliveryStreamName, function (err: string) {
        if (err) {
          reduceCallback(err, successCount)
        } else {
          reduceCallback(null, successCount + 1)
        }
      })
    },
    function (err?: string | null, result?: number) {
      const successfulBatches = result
      if (err) {
        console.log('Forwarding failure after ' + successfulBatches + ' successful batches')
        callback(err)
      } else {
        console.log(
          'Event forwarding complete. Forwarded ' +
            successfulBatches +
            ' batches comprising ' +
            records.length +
            ' records to Firehose ' +
            deliveryStreamName
        )
        callback(null, {
          deliveryStreamName: deliveryStreamName,
          batchesDelivered: successfulBatches,
          recordCount: records.length,
        })
      }
    }
  )
}
