import { isLocalhost } from '../lib/localhost'

const useLocalApi = isLocalhost

export const API_VERSION = 'v1'

export const AWS_REGION = 'us-east-1'
const API_HOST_ID = 'abcdefg123'
const PRODUCTION_API_HOST = `https://${API_HOST_ID}.execute-api.${AWS_REGION}.amazonaws.com`
const LOCAL_API_HOST = 'http://localhost:4000'
export const API_HOST = useLocalApi ? LOCAL_API_HOST : PRODUCTION_API_HOST
export const IDENTITY_POOL_ID = `us-east-1:12345678-1234-1234-1234-1234567890ab`
export const USER_POOL_ID = 'us-east-1_1234567ab'
export const USER_POOL_WEB_CLIENT_ID = '1234abcd1234abcd1234abcd12'
export const OAUTH_DOMAIN = 'abcd1234.auth.us-east-1.amazoncognito.com'

export const LOCAL_APP_URL = 'http://localhost:3000'
export const PRODUCTION_APP_URL = 'https://abcd1234abcd12.cloudfront.net'
export const APP_URL = isLocalhost !== undefined && isLocalhost === false ? PRODUCTION_APP_URL : LOCAL_APP_URL
