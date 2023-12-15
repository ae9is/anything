import logger from 'logger'
import { isLocalhost } from '../lib/localhost'

export const API_VERSION = 'v1'
const useLocalApi = false // isLocalhost

export const AWS_ACCOUNT_ID = '012345678901'
export const AWS_REGION = 'us-east-1'
const API_HOST_ID = 'abcdefg123'
export const IDENTITY_POOL_ID = `us-east-1:12345678-1234-1234-1234-1234567890ab`
export const USER_POOL_ID = 'us-east-1_1234567ab'
export const USER_POOL_WEB_CLIENT_ID = '1234abcd1234abcd1234abcd12'
export const OAUTH_DOMAIN = 'abcd1234.auth.us-east-1.amazoncognito.com'
export const PRODUCTION_APP_URL = 'https://abcd1234abcd12.cloudfront.net'
//export const DASHBOARD_URL = 'https://quicksightdomain/sn/embed/share/accounts/accountid/dashboards/dashboardid?directory_alias=account_directory_alias'
//export const DASHBOARD_URL = 'https://<domain>.grafana.net/dashboard/snapshot/<id>'
//export const DASHBOARD_URL = 'https://<domain>.grafana.net/public-dashboards/<id>'
export const DASHBOARD_URL = ''

const LOCAL_API_HOST = `http://localhost:4000/${API_VERSION}`
const PRODUCTION_API_HOST = `https://${API_HOST_ID}.execute-api.${AWS_REGION}.amazonaws.com/${API_VERSION}`
export const API_HOST = useLocalApi ? LOCAL_API_HOST : PRODUCTION_API_HOST
export const COGNITO_ID = `cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`
export const LOCAL_APP_URL = 'http://localhost:3000'
export const APP_URL = isLocalhost !== undefined && isLocalhost === false ? PRODUCTION_APP_URL : LOCAL_APP_URL
logger.debug('App url: ' + APP_URL)
logger.debug('Api host: ' + API_HOST)
