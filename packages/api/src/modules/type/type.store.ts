import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { ddbDocClient, gsi3, table, gsi3Id } from '../../services/dynamodb'

// TODO FIXME Need to rework model so that types are stored in separate table, uniquely.
//  Dynamodb stream -> lambda function -> write unique record to types table.
//  ref: https://stackoverflow.com/questions/70727986/
//
// Gsi3 projection of type contains duplicated types.
// I.e. there's a type for every type attribute of every item in the table.
// ref: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html
//
//
// Item types should be limited
export const getTypes = async (startKey?: any, limit = 200) => {
  const cmd = new ScanCommand({
    TableName: table,
    IndexName: gsi3,
    ProjectionExpression: '#type',
    ExpressionAttributeNames: { '#type': gsi3Id },
    Limit: limit,
    ExclusiveStartKey: startKey,
  })
  const resp = await ddbDocClient.send(cmd)
  return { items: resp?.Items, lastKey: resp?.LastEvaluatedKey }
}
