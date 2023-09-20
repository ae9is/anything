import { SignatureV4 } from '@smithy/signature-v4'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { Sha256 } from '@aws-crypto/sha256-browser'
import { Amplify, API } from 'aws-amplify'

import awsExports, { apiName} from '../config/amplify'
Amplify.configure(awsExports)

import logger from 'logger'
import { AWS_REGION, API_HOST, API_VERSION } from '../config'
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
    const fullPath = `${API_HOST}/${version}/${path}`
    const requestBody = JSON.stringify(body)
    const endpoint = new URL(fullPath)
    const requestToBeSigned = new HttpRequest({
      method: method,
      headers: {
        'Content-Type': 'application/json',
        host: endpoint.host,
      },
      hostname: endpoint.host,
      body: requestBody,
      path: endpoint.pathname,
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
    const request = new Request(fullPath, {
      ...signedRequest, 
      headers: new Headers(headers),
      credentials: 'include',
    })
    logger.debug('Request Request: ', request)
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
  let statusCode = 200
  let responseBody
  let statusText
  try {
    logger.debug('Fetching request ...')
    const response = await fetch(request)
    responseBody = await response.json()
    if (responseBody.errors) statusCode = 400
  } catch (error: any) {
    statusCode = 500
    statusText = error?.message
    responseBody = {
      errors: [
        {
          message: error?.message || error,
        },
      ],
    }
  }
  return {
    data: responseBody,
    status: statusCode,
    statusText: statusText,
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
