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

import { map } from 'async'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import * as c from './constants'

const debug = process.env.DEBUG || false

export function addNewlineTransformer(data: any, callback: any) {
  // emitting a new buffer as text with newline
  callback(null, Buffer.from(data + '\n', c.targetEncoding))
}

/** Convert JSON data to its String representation */
export function jsonToStringTransformer(data: any, callback: any) {
  // emitting a new buffer as text with newline
  callback(null, Buffer.from(JSON.stringify(data) + '\n', c.targetEncoding))
}

/** literally nothing at all transformer - just wrap the object in a buffer */
export function doNothingTransformer(data: any, callback: any) {
  // emitting a new buffer as text with newline
  callback(null, Buffer.from(data, c.targetEncoding))
}

/**
 * Example transformer that converts a regular expression to delimited text
 */
export function regexToDelimiter(regex: RegExp | string, delimiter: string, data: any, callback: (msg?: string, buf?: any) => void) {
  const tokens = JSON.stringify(data).match(regex)
  if (tokens) {
    // emitting a new buffer as delimited text whose contents are the regex
    // character classes
    callback(undefined, Buffer.from(tokens.slice(1).join(delimiter) + '\n'))
  } else {
    callback('Configured Regular Expression does not match any tokens', null)
  }
}

// DynamoDB Streams emit typed low-level JSON data, like: {"key":{"S":"value"}}
// This transformer unboxes that typing.
export function unmarshallDynamoDBTransformer(data: any, callback: any) {
  let json = data
  if (typeof data === 'string' || data instanceof String) {
    json = JSON.parse(data.toString())
  }
  const keys = data?.Keys && unmarshall(data.Keys)
  const newImage = data?.NewImage && unmarshall(data.NewImage)
  const oldImage = data?.OldImage && unmarshall(data.OldImage)
  const unmarshalled = { ...data, Keys: keys }
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
export function flattenDynamoDBTransformer(data: any, callback: any) {
  let extractKeys = c.EXTRACT_KEYS?.split(',')
  if (!extractKeys || extractKeys.length <= 0) {
    extractKeys = []
  }
  let json = data
  if (typeof data === 'string' || data instanceof String) {
    json = JSON.parse(data.toString())
  }
  let keys = data?.Keys ? unmarshall(data.Keys) : {}
  let newImage = data?.NewImage ? unmarshall(data.NewImage) : {}
  const eventName = data?.eventName
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

export function transformRecords(serviceName: string, transformer: any, userRecords: any, callback: any) {
  map(
    userRecords,
    function (userRecord: any, userRecordCallback: any) {
      const dataItem =
        serviceName === c.KINESIS_SERVICE_NAME
          ? Buffer.from(userRecord.data, 'base64').toString(c.targetEncoding)
          : userRecord

      transformer.call(undefined, dataItem, function (err?: Error | string, transformed?: Buffer) {
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

export async function setupTransformer(callback?: (...args: any[]) => Promise<void>) {
  // Set the default transformer
  let t = jsonToStringTransformer.bind(undefined)
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
      if (callback) {
        await callback(
          'Configured Transformer function ' +
            TRANSFORMER_FUNCTION +
            ' is not a valid transformation method in the transformer.js module'
        )
      }
    } else {
      if (debug) {
        console.log('Setting data transformer based on Transformer Override configuration')
      }
      // Dynamically bind in the transformer function
      t = transformerFunctions[TRANSFORMER_FUNCTION].bind(undefined)
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
          STREAM_DATATYPE = STREAM_DATATYPE_ENV as keyof typeof c.supportedDatatypeTransformerMappings
        }
      })
      if (found) {
        // Set the transformer class via a cross reference to the transformer mapping
        if (debug) {
          console.log('Setting data transformer based on Stream Datatype configuration')
        }
        const supportedDatatype = c.supportedDatatypeTransformerMappings[STREAM_DATATYPE]
        t = transformerFunctions[supportedDatatype].bind(undefined)
      }
    } else {
      if (debug) {
        console.log('No Stream Datatype Environment Configuration found')
      }
    }
  }
  if (debug) {
    console.log('Using Transformer function ' + t.name)
  }
  if (callback) {
    await callback(null, t)
  }
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
