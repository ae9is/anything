import { SignatureV4 } from '@smithy/signature-v4'
import { HeaderBag } from '@smithy/types'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { Sha256 } from '@aws-crypto/sha256-browser'
import { Amplify, API } from 'aws-amplify'
import { StatusCodes } from 'http-status-codes'
import crypto, { BinaryToTextEncoding } from 'crypto'
import aws4 from 'aws4'

import awsExports, { apiName} from '../config/amplify'
Amplify.configure(awsExports)

import logger from 'logger'
import { stringify } from 'utils'
import { AWS_REGION, API_HOST, PRODUCTION_APP_URL } from '../config'
import { getCredentialsForApi } from './auth'
import { encodeProps, removeEmptyProps } from './props'
import { OutgoingHttpHeaders } from 'http2'
import { OutgoingHttpHeader } from 'http'

const BODY_HASH_HEADER = 'X-Amz-Content-Sha256'
const AUTH_HEADERS = [
  'Authorization',
  'X-Amz-Date',
  'X-Amz-Security-Token',
  BODY_HASH_HEADER,
]

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
  queryParams?: QueryParameterBag
  useAws4?: boolean // An alternative to SignatureV4 for signing requests
}

export async function request(props: RequestProps) {
  return requestUsingCustom(props)
}

// Sign and send requests to HTTP gateway using AWS signature v4.
// ref: https://stackoverflow.com/a/74645332
// ref: https://docs.amplify.aws/guides/functions/graphql-from-lambda/q/platform/js/#iam-authorization
export async function requestUsingCustom(props: RequestProps) {
  try {
    const { body = undefined, method, path, queryParams = {}, useAws4 = false } = props
    const requestBody = stringify(body)
    const executeApiPath = `${API_HOST}/${path}`
    const executeApiEndpoint = new URL(executeApiPath)
    const encodedQueryParams = encodeProps(removeEmptyProps(queryParams))
    const queryString = queryParamsToUrlString(encodedQueryParams)
    const requestUrl = `${executeApiPath}${queryString}`
    const requestPath = `${executeApiEndpoint.pathname}${queryString}`
    logger.debug('Execute api endpoint host: ', executeApiEndpoint.host)
    logger.debug('Request url: ', requestUrl)
    logger.debug('Request path: ', requestPath)

    /*
    const cloudFrontPath = `${PRODUCTION_APP_URL}/${path}`
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
    const bodyHash = requestBody && getBodyHash(requestBody)
    logger.debug('Request body hash: ', bodyHash)
    const bodyHashHeader: {} | { [BODY_HASH_HEADER]: string } = bodyHash ? {
      [BODY_HASH_HEADER]: bodyHash,
    } : {}
    const presignHeaders = {
      ...contentTypeHeader,
      ...bodyHashHeader,
      // Modifying host header is forbidden in browsers and this will be stripped from the request,
      //  but we need to set here just for the authorization header
      host: executeApiEndpoint.host,
    }
    let signedRequest
    if (useAws4) {
      const requestToBeSigned = {
        method: method.toUpperCase(),
        headers: presignHeaders,
        host: executeApiEndpoint.host,
        body: requestBody,
        // For aws4.sign(), path should be the full path including query string.
        path: requestPath,
      }
      logger.debug('Request pre-sign: ', requestToBeSigned)
      signedRequest = await signRequestAws4(requestToBeSigned)
    } else {
      const requestToBeSigned = new HttpRequest({
        method: method.toUpperCase(),
        protocol: 'https',
        hostname: executeApiEndpoint.host,
        // For SignatureV4.sign(HttpRequest), path should be the path excluding query string.
        path: executeApiEndpoint.pathname,
        query: encodedQueryParams,
        headers: presignHeaders,
        body: requestBody,
      })
      logger.debug('Request pre-sign: ', requestToBeSigned)
      signedRequest = await signRequestSignatureV4(requestToBeSigned) as HttpRequest
    }
    logger.debug('Request post-sign: ', signedRequest)
    const signedHeaders = signedRequest?.headers
    logger.debug('Request post-sign headers: ', signedHeaders)
    const fetchHeaders = convertHeaders(signedHeaders)
    logger.debug('Request headers: ', fetchHeaders)
    //logger.debug('Request query: ', signedRequest?.query)
    //const requestQueryParams = Object.entries(signedRequest?.query)?.map(([key, val]) => [key, val])
    //logger.debug('Request query params: ', requestQueryParams)
    //const request = new Request(cloudFrontPath, { // CloudFront proxying API Gateway using IAM auth only works with custom domain
    // ref: https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options
    const request = new Request(requestUrl, {
      ...signedRequest, 
      headers: new Headers(fetchHeaders),
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

// Convert headers returned from Aws4 or SignatureV4 request signing into 
//  headers that can be used to create a fetch api Request.
function convertHeaders(signedHeaders?: HeaderBag | OutgoingHttpHeaders): HeadersInit {
  const stringHeaders: { [key: string]: string | undefined } = {}
  Object.entries(signedHeaders ?? {})?.forEach(
    ([key, val]: [key: string, val?: OutgoingHttpHeader]) => {
      stringHeaders[key] = String(val)
    }
  )
  const headers: HeadersInit = removeEmptyProps(stringHeaders)
  return headers
}

// ref: https://github.com/postmanlabs/postman-runtime/blob/develop/lib/authorizer/aws4.js
function getBodyHash(body: string, algorithm = 'sha256', digestEncoding: BinaryToTextEncoding = 'hex') {
  if (!body) {
    return
  }
  const hash = crypto.createHash(algorithm)
  hash.update(body)
  return hash.digest(digestEncoding)
}

function queryParamsToUrlString(queryParams: any) {
  const paramStrings = Object.entries(queryParams).map(([key, val]) => `${key}=${val}`)
  const queryString = paramStrings?.length > 0 ? '?' + paramStrings?.join('&') : ''
  return queryString
}

async function signRequestSignatureV4(request: HttpRequest) {
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

async function signRequestAws4(request: aws4.Request) {
  const credentials = await getCredentialsForApi()
  if (!credentials) {
    throw new Error('Could not get credentials')
  }
  const aws4Credentials: aws4.Credentials = {
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken || undefined,
  }
  const aws4Request: aws4.Request = {
    host: request.host,
    path: request.path,
    service: 'execute-api',
    region: AWS_REGION,
    method: request.method,
    body: request.body,
    headers: request.headers,
    signQuery: false,
  }
  const signedRequest = aws4.sign(aws4Request, aws4Credentials)
  return signedRequest
}

async function sendRequest(request: Request) {
  let status = StatusCodes.OK
  let responseBody
  let statusText
  try {
    logger.debug('Fetching request using fetch ...')
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
    const { body = undefined, method, path, queryParams = {} } = props
    const requestBody = stringify(body)
    const params = {
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
        //host: API_HOST,
      },
    }
    const fullPath = `/${path}`
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
