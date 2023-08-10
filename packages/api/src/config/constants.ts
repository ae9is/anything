export const NODE_ENV = process.env.NODE_ENV || 'development'
export const IS_OFFLINE = NODE_ENV === 'development' && (process.env.IS_OFFLINE || false)
export const API_VERSION = process.env.API_VERSION || '1'
export const STAGE = process.env.STAGE || 'dev'
export const SERVICE_NAME = 'anything'
const LOCALSTACK_PORT = process.env.LOCALSTACK_PORT
let awsRegion
let databaseUrl
if (IS_OFFLINE) {
  if (STAGE === 'local' && LOCALSTACK_PORT) {
    awsRegion = undefined
    databaseUrl = `http://127.0.0.1:${LOCALSTACK_PORT}`
  } else {
    awsRegion = undefined
    databaseUrl = 'http://127.0.0.1:5000'
  }
} else {
  awsRegion = process.env.AWS_REGION ?? 'us-east-1'
  databaseUrl = process.env.DATABASE_URL ?? undefined
}
export const AWS_REGION = awsRegion
export const DATABASE_URL = databaseUrl
export const API_PORT = process.env.API_PORT || '4000'
export const LOCAL_API_HOST = `http://localhost:${API_PORT}`