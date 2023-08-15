// Send requests using amplify library
import { API } from 'aws-amplify'

import logger from 'logger'
import { AWS_REGION, API_HOST, API_VERSION } from '../config'
//import { getCredentialsForServices } from './auth'
import { apiName } from '../config/amplify'
import { removeEmptyProps } from './props'

export type HttpMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH'

//import { QueryParameterBag } from '@aws-sdk/types'
export type QueryParameterBag = {
  [x: string]: string | string[] | number | boolean | null | undefined
}

export interface RequestProps {
  method: HttpMethod
  path: string
  body?: any
  version?: string
  queryParams?: QueryParameterBag
}

/*
// Sign and send requests to HTTP gateway using AWS signature v4
import { HttpRequest } from '@aws-sdk/protocol-http'
//import { HttpRequest as HttpRequestType } from '@aws-sdk/types'
import { SignatureV4 } from '@aws-sdk/signature-v4'
import { Sha256 } from '@aws-crypto/sha256-browser'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import { QueryParameterBag } from '@aws-sdk/types'

// ref: https://stackoverflow.com/a/74645332
export async function requestUsingCustom(props: RequestProps) {
  try {
    const { body = undefined, method, path, version = API_VERSION, queryParams = {} } = props
    const requestBody = JSON.stringify(body)
    const request = new HttpRequest({
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
        host: API_HOST,
      },
      hostname: API_HOST,
      port: 443,
      method: method,
      path: `/${version}/${path}`,
      query: queryParams,
    })
    const signedRequest = await signRequest(request)
    const response = await sendRequest(signedRequest)
    return response
  } catch (e) {
    logger.error(e)
    throw e
  }
}

async function signRequest(request: HttpRequest) {
  const credentials = await getCredentialsForServices()
  const signer = new SignatureV4({
    credentials: credentials,
    region: AWS_REGION,
    service: 'execute-api',
    sha256: Sha256,
  })
  // SignatureV4 just modifies the request's headers, if we pass in protocol-http/HttpRequest in,
  //  even though the method signature is types/HttpRequest we should be able to just ignore that.
  // ref: https://github.com/aws/aws-sdk-js-v3/blob/3bad0433/packages/signature-v4/src/SignatureV4.ts#L245
  // ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/classes/_aws_sdk_signature_v4.SignatureV4.html#sign
  const signedRequest = await signer.sign(request)
  return signedRequest as HttpRequest
}

async function sendRequest(request: HttpRequest) {
  const handler = new NodeHttpHandler()
  const { response } = await handler.handle(request)
  return response
}
*/

// ref: https://docs.amplify.aws/lib/restapi/fetch/q/platform/js/
export async function requestUsingAmplify(props: RequestProps) {
  try {
    const { body = undefined, method, path, version = API_VERSION, queryParams = {} } = props
    const requestBody = JSON.stringify(body)
    const params = {
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
        //host: API_HOST,
      },
    }
    const fullPath = `/${version}/${path}`
    let response
    if (method === 'GET') {
      response = await API.get(apiName, fullPath, {
        queryStringParameters: removeEmptyProps(queryParams),
        ...params,
      })
    } else if (method === 'POST') {
      response = await API.post(apiName, fullPath, params)
    } else if (method === 'PUT') {
      response = await API.put(apiName, fullPath, params)
    } else if (method === 'DELETE') {
      response = await API.del(apiName, fullPath, params)
    } else {
      throw new Error('Unsupported method passed to request: ' + method)
    }
    return response
  } catch (e) {
    logger.error(e)
    throw e
  }
}
