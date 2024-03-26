/**
 * Example transformer that adds a newline to each event
 *
 * Args:
 *
 * data - Object or string containing the data to be transformed
 *
 * callback(err, Buffer) - callback to be called once transformation is
 * completed. If supplied callback is with a null/undefined output (such as
 * filtering) then nothing will be sent to Firehose
 */

import * as deagg from 'aws-kinesis-agg'
import { map } from 'async'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import * as c from './constants'
import { DynamoDBDataItem } from './handler'

const debug = process.env.DEBUG || false

export interface TransformerFunctionProps {
  data: string | deagg.UserRecord | DynamoDBDataItem,
  callback: (err: string | null, transformed: Buffer) => void,
}

export type TransformerFunction = (props: TransformerFunctionProps) => void

export function addNewlineTransformer({ data, callback }: TransformerFunctionProps) {
  // emitting a new buffer as text with newline
  callback(null, Buffer.from(data + '\n', c.targetEncoding))
}

/** Convert JSON data to its String representation */
export function jsonToStringTransformer({ data, callback }: TransformerFunctionProps) {
  callback(null, Buffer.from(JSON.stringify(data) + '\n', c.targetEncoding))
}

/** literally nothing at all transformer - just wrap the object in a buffer */
export function doNothingTransformer({ data, callback }: TransformerFunctionProps) {
  callback(null, Buffer.from(data + '', c.targetEncoding))
}

// DynamoDB Streams emit typed low-level JSON data, like: {"key":{"S":"value"}}
// This transformer unboxes that typing.
export function unmarshallDynamoDBTransformer({ data, callback }: TransformerFunctionProps) {
  let json: any
  if (typeof data === 'string' || data instanceof String) {
    json = JSON.parse(data.toString())
  } else {
    json = data
  }
  const keys = json?.Keys && unmarshall(json.Keys)
  const newImage = json?.NewImage && unmarshall(json.NewImage)
  const oldImage = json?.OldImage && unmarshall(json.OldImage)
  const unmarshalled = { ...json, Keys: keys }
  if (newImage) {
    unmarshalled.NewImage = newImage
  }
  if (oldImage) {
    unmarshalled.OldImage = oldImage
  }
  callback(null, Buffer.from(JSON.stringify(unmarshalled) + '\n', c.targetEncoding))
}

// Unmarshall DynamoDB streams data, and flatten/filter data, extracting only the specified keys from NewImage.
// Data in Keys (i.e. id, sort) will always be extracted but can be overwritten by extract keys for NewImage if specified.
// 
// Also extracts data.eventName (INSERT, MODIFY, REMOVE). It's missing in the docs but present in the actual stream record.
// ref: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_streams_Record.html
//      https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_streams_StreamRecord.html
export function flattenDynamoDBTransformer({ data, callback }: TransformerFunctionProps) {
  let extractKeys = c.EXTRACT_KEYS?.split(',')
  if (!extractKeys || extractKeys.length <= 0) {
    extractKeys = []
  }
  let json: any
  if (typeof data === 'string' || data instanceof String) {
    json = JSON.parse(data.toString())
  } else {
    json = data
  }
  let keys = json?.Keys ? unmarshall(json.Keys) : {}
  let newImage = json?.NewImage ? unmarshall(json.NewImage) : {}
  const eventName = json?.eventName
  const filtered = { eventName, ...keys, ...filter(newImage, extractKeys) }
  callback(null, Buffer.from(JSON.stringify(filtered) + '\n', c.targetEncoding))
}

// Return an object with only specified keys in it
function filter(object: any, filterKeys: string[]) {
  return Object.keys(object).filter(key => filterKeys.includes(key)).reduce((filtered: any, key: string) => {
    filtered[key] = object[key]
    return filtered
  }, {})
}

export function transformRecords(
  serviceName: string,
  transformer: TransformerFunction,
  userRecords: (deagg.UserRecord | DynamoDBDataItem)[],
  callback: (err: Error | string | null, transformed?: (Buffer | undefined)[]) => void,
) {
  map(
    userRecords,
    function (userRecord: deagg.UserRecord | DynamoDBDataItem, userRecordCallback: (err: Error | string | null, transformed?: Buffer) => void) {
      // If Kinesis service name, userRecord will be type UserRecord.
      // For DynamoDB, userRecord will be DynamoDBDataItem.
      let record: string | typeof userRecord = userRecord
      if (serviceName === c.KINESIS_SERVICE_NAME) {
        const userRecordData = (userRecord as deagg.UserRecord)?.data
        if (userRecordData) {
          record = Buffer.from(userRecordData, 'base64').toString(c.targetEncoding)
        }
      }
      const dataItem = record
      transformer.call(undefined, {
        data: dataItem,
        callback: function (err?: Error | string | null, transformed?: Buffer) {
          if (err) {
            console.log(JSON.stringify(err))
            userRecordCallback(err)
          } else {
            if (transformed && transformed instanceof Buffer) {
              // call the map callback with the
              // transformed Buffer decorated for use as a
              // Firehose batch entry
              userRecordCallback(null, transformed)
            } else {
              // don't know what this transformed
              // object is
              userRecordCallback(
                'Output of Transformer was malformed. Must be instance of Buffer or routable Object'
              )
            }
          }
        },
      })
    },
    function (err, transformed) {
      // user records have now been transformed, so call
      // errors or invoke the transformed record processor
      if (err) {
        callback(err)
      } else {
        callback(null, transformed)
      }
    }
  )
}

export async function setupTransformer(
  callback: (err: Error | string | null, transformer: TransformerFunction) => Promise<void>
) {
  // Set the default transformer
  let transformer: TransformerFunction = jsonToStringTransformer.bind(undefined)
  // Check if the transformer has been overridden by environment settings
  const TRANSFORMER_FUNCTION_ENV: string | undefined = process.env[c.TRANSFORMER_FUNCTION_ENV]
  let TRANSFORMER_FUNCTION: keyof typeof transformerFunctions = 'jsonToStringTransformer'
  if (TRANSFORMER_FUNCTION_ENV) {
    let found = false
    for (const [key, value] of Object.entries(c.transformerRegistry)) {
      if (TRANSFORMER_FUNCTION_ENV === value) {
        found = true
        TRANSFORMER_FUNCTION = TRANSFORMER_FUNCTION_ENV as keyof typeof c.transformerRegistry
      }
    }
    if (!found) {
      await callback?.(
        'Configured Transformer function ' +
          TRANSFORMER_FUNCTION +
          ' is not a valid transformation method in the transformer.js module',
        transformer
      )
    } else {
      if (debug) {
        console.log('Setting data transformer based on Transformer Override configuration')
      }
      // Dynamically bind in the transformer function
      transformer = transformerFunctions[TRANSFORMER_FUNCTION].bind(undefined)
    }
  } else {
    if (debug) {
      console.log('No Transformer Override Environment Configuration found')
    }
    // Set the transformer based on specified datatype of the stream
    const STREAM_DATATYPE_ENV: string | undefined = process.env[c.STREAM_DATATYPE_ENV]
    let STREAM_DATATYPE: keyof typeof c.supportedDatatypeTransformerMappings = 'JSON'
    if (STREAM_DATATYPE_ENV) {
      let found = false
      Object.keys(c.supportedDatatypeTransformerMappings).forEach(function (key) {
        if (STREAM_DATATYPE_ENV === key) {
          found = true
          STREAM_DATATYPE =
            STREAM_DATATYPE_ENV as keyof typeof c.supportedDatatypeTransformerMappings
        }
      })
      if (found) {
        // Set the transformer class via a cross reference to the transformer mapping
        if (debug) {
          console.log('Setting data transformer based on Stream Datatype configuration')
        }
        const supportedDatatype = c.supportedDatatypeTransformerMappings[STREAM_DATATYPE]
        transformer = transformerFunctions[supportedDatatype].bind(undefined)
      }
    } else {
      if (debug) {
        console.log('No Stream Datatype Environment Configuration found')
      }
    }
  }
  if (debug) {
    console.log('Using Transformer function ' + transformer.name)
  }
  await callback?.(null, transformer)
}

const transformerFunctions = {
  'doNothingTransformer': doNothingTransformer,
  'addNewlineTransformer': addNewlineTransformer,
  'jsonToStringTransformer': jsonToStringTransformer,
  'unmarshallDynamoDBTransformer': unmarshallDynamoDBTransformer,
  'flattenDynamoDBTransformer': flattenDynamoDBTransformer,
}

type transformerFunctionKeys = keyof typeof transformerFunctions
type transformerFunction = typeof transformerFunctions[transformerFunctionKeys]
