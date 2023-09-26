import { StatusCodes } from 'http-status-codes'
import { NODE_ENV, ORIGIN } from '../config'
const { stringify } = JSON

// Reference for Lambda function response format:
// https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
//
// Body should be a JSON string
// https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-types-transforms
//
// Error response must be text/plain and different format, or a default error will be returned by API gateway
// https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#services-apigateway-errors
//
// Ex:
// https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html
export function send(data: any, statusCode: number = StatusCodes.OK) {
  const spacing = NODE_ENV === 'development' ? 2 : 0
  if (200 <= statusCode && statusCode < 300) {
    return sendJson(data, statusCode, spacing)
  } else {
    return sendError(data, statusCode)
  }
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,' + 
    'X-Api-Key,X-Requested-With,Accept,Access-Control-Allow-Methods,Access-Control-Allow-Origin,' + 
    'Access-Control-Allow-Headers,X-Amz-Content-Sha256',
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  'Access-Control-Allow-Credentials': 'true',
}

export function sendJson(data: any, statusCode: number = StatusCodes.OK, spacing = 0) {
  const body = stringify({ data: data ?? {} }, null, spacing)
  return {
    statusCode,
    headers: {
      // If CORS is configured in api gateway, then CORS headers set here will be ignored
      // ref: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body,
  }
}

// Note that IAM auth failure will not throw 403 here, instead HTTP API gateway will return its own Forbidden response
export function sendError(error: any, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) {
  const body = statusCode + ': ' + stringify(error)
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/plain',
      'x-amzn-ErrorType': statusCode,
      ...corsHeaders,
    },
    isBase64Encoded: false,
    body,
  }
}
