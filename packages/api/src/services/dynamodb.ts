import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { CreateTableCommandInput, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import logger from 'logger'
import { AWS_REGION, DATABASE_URL, IS_OFFLINE, STAGE, SERVICE_NAME } from '../config'
import defaultSchema from '../migrations/schema.json'
import typesSchema from '../migrations/schema-types.json'

// Should match service name in serverless.yml and stage in _provider.yml
const namespace = SERVICE_NAME + (STAGE ? '-' + STAGE : '') + '-'

// Define dummy keys for offline testing in case no keys are set at all
// (-sharedDb flag is used to start dynamodb local, so the actual keys should not matter at all)
const dummyKeys = {
  accessKeyId: 'DummyAccessKeyId',
  secretAccessKey: 'DummySecretAccessKey',
}

const offlineConfig = IS_OFFLINE ? {
  ...dummyKeys,
} : {}

const onlineConfig = IS_OFFLINE ? {} : {
  region: AWS_REGION,
}

const clientConfig = {
  endpoint: DATABASE_URL,
  ...offlineConfig,
  ...onlineConfig,
}

// Client creates and handles the connection. (Expects AttributeValue's.)
// DocumentClient abstracts client to work with regular javascript objects.
// ref: https://www.npmjs.com/package/@aws-sdk/lib-dynamodb
export const ddbClient = new DynamoDBClient(clientConfig)
export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient)

export const schema: CreateTableCommandInput = defaultSchema
export const table = namespace + defaultSchema?.TableName
logger.debug('Using table: ' + table)
export const gsi1 = defaultSchema?.GlobalSecondaryIndexes?.[0].IndexName
export const gsi1Id = defaultSchema?.GlobalSecondaryIndexes?.[0].KeySchema?.filter(
  (attr) => attr.KeyType === 'HASH'
)[0]?.AttributeName
export const gsi1Sort = defaultSchema?.GlobalSecondaryIndexes?.[0].KeySchema?.filter(
  (attr) => attr.KeyType === 'RANGE'
)[0]?.AttributeName
export const gsi2 = defaultSchema?.GlobalSecondaryIndexes?.[1].IndexName
export const gsi2Id = defaultSchema?.GlobalSecondaryIndexes?.[1].KeySchema?.filter(
  (attr) => attr.KeyType === 'HASH'
)[0]?.AttributeName
export const gsi2Sort = defaultSchema?.GlobalSecondaryIndexes?.[1].KeySchema?.filter(
  (attr) => attr.KeyType === 'RANGE'
)[0]?.AttributeName

export const typesTable = namespace + typesSchema?.TableName

export const testDataFilePath = 'src/data/testData.json' // relative to api project root
