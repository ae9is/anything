import { SignatureV4 } from '@smithy/signature-v4'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { Sha256 } from '@aws-crypto/sha256-browser'
import { Amplify, API } from 'aws-amplify'
import { StatusCodes } from 'http-status-codes'

import awsExports, { apiName} from '../config/amplify'
Amplify.configure(awsExports)

import logger from 'logger'
import { AWS_REGION, API_HOST, API_VERSION, PRODUCTION_APP_URL } from '../config'
import { getCredentialsForApi } from './auth'
import { removeEmptyProps } from './props'
//import axios from 'axios'

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

export async function request(props: RequestProps) {
  return requestUsingCustom(props)
}

// Sign and send requests to HTTP gateway using AWS signature v4.
// ref: https://stackoverflow.com/a/74645332
// ref: https://docs.amplify.aws/guides/functions/graphql-from-lambda/q/platform/js/#iam-authorization
export async function requestUsingCustom(props: RequestProps) {
  try {
    const { body = undefined, method, path, version = API_VERSION, queryParams = {} } = props
    const requestBody = JSON.stringify(body)
    const executeApiPath = `${API_HOST}/${version}/${path}`
    const executeApiEndpoint = new URL(executeApiPath)

    /*
    const cloudFrontPath = `${PRODUCTION_APP_URL}/${version}/${path}`
    const cloudFrontEndpoint = new URL(cloudFrontPath)

    // For CloudFront reverse proxy to API Gateway with IAM auth, need to sign request as if it were being send to API Gateway
    // ref: https://stackoverflow.com/questions/43060915
    // ref: https://stackoverflow.com/questions/48815143
    */

    // Need to conditionally set content-type header, api doesn't support content-type for get requests
    //  (for ex, to intelligently infer which type to return).
    const contentTypeHeader: {} | { 'Content-Type': string } = (method === 'GET' || method === 'HEAD') ? {} : {
      'Content-Type': 'application/json',
    }
    const requestToBeSigned = new HttpRequest({
      method: method,
      headers: {
        ...contentTypeHeader,
        // Modifying host header is forbidden in browsers and this will be stripped from the request,
        //  but we need to set here just for the authorization header
        host: executeApiEndpoint.host,
      },
      hostname: executeApiEndpoint.host,
      body: requestBody,
      path: executeApiEndpoint.pathname,
      query: removeEmptyProps(queryParams),
    })
    logger.debug('Request pre-sign: ', requestToBeSigned)
    const signedRequest: HttpRequest = await signRequest(requestToBeSigned) as HttpRequest
    logger.debug('Request post-sign: ', signedRequest)
    //const response = await sendRequestAxios(fullPath, signedRequest)
    const headerBag = signedRequest?.headers
    logger.debug('Request post-sign headers: ', headerBag)
    const headers: [string, string][] = Object.entries(headerBag)?.map(([key, val], idx) => [key, val])
    logger.debug('Request headers: ', headers)
    //const request = new Request(cloudFrontPath, { // CloudFront proxying API Gateway using IAM auth only works with custom domain
    const request = new Request(executeApiPath, {
      ...signedRequest, 
      headers: new Headers(headers),
      credentials: 'include',
    })
    logger.debug('Request Request: ', request)
    logger.debug('Request Request.headers:')
    request?.headers?.forEach((value, key) => {
      logger.debug(`${key}: ${value}\n`)
    })
    const response = await sendRequest(request)
    return response
  } catch (e) {
    logger.error(e)
    throw e
  }
}

async function signRequest(request: HttpRequest) {
  const credentials = await getCredentialsForApi()
  if (!credentials) {
    throw new Error('Could not get credentials')
  }
  const signer = new SignatureV4({
    credentials: credentials,
    region: AWS_REGION,
    service: 'execute-api',
    sha256: Sha256,
  })
  const signedRequest = await signer.sign(request)
  return signedRequest
}

/*
async function sendRequestAxios(fullPath: string, request: HttpRequest) {
  let statusCode = 200
  let responseBody
  let statusText
  try {
    logger.debug('Fetching request ...')
    const response = await axios({
      ...request,
      url: fullPath,
      params: request?.query,
    })
    responseBody = response?.data
    statusCode = response?.status
    statusText = response?.statusText
  } catch (error: any) {
    statusCode = 500
    if (error.response) {
      responseBody = {
        errors: [
          {
            message: error.response?.data || error,
          },
        ],
      }
      statusCode = error.response?.status ?? 500
    } else if (error.request) {
      logger.error('Request error: ', error?.request)
    } else {
      logger.error('Axios error: ', error?.message)
    }
  }
  return {
    data: responseBody,
    status: statusCode,
    statusText: statusText,
  }
}
*/

async function sendRequest(request: Request) {
  let status = StatusCodes.OK
  let responseBody
  let statusText
  try {
    logger.debug('Fetching request ...')
    const response = await fetch(request)
    status = response.status
    statusText = response.statusText
    responseBody = await response.json()
  } catch (error: any) {
    logger.error('Error sending request: ', error)
  }
  return {
    data: responseBody?.data,
    status,
    statusText,
  }
}

// Amplify does not obtain correct credentials (from cognito identity pool) and 
//  so this method fails for IAM secured api.
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
