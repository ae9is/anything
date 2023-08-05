import { StatusCodes } from 'http-status-codes'
import { NODE_ENV } from '../config'
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

export function sendJson(data: any, statusCode: number = StatusCodes.OK, spacing = 0) {
  const body = stringify({ data: data || {} }, null, spacing)
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'content-type': 'application/json',
    },
    body,
  }
}

export function sendError(error: any, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) {
  const body = statusCode + ': ' + stringify(error)
  return {
    statusCode,
    headers: {
      'content-type': 'text/plain',
      'x-amzn-ErrorType': statusCode,
    },
    isBase64Encoded: false,
    body,
  }
}
