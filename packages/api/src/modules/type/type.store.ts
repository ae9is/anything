import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { ddbDocClient, typesTable } from '../../services/dynamodb'

// Types are stored in separate table, uniquely, since a GSI project of the type attribute 
//  would contain duplicates (a type for every type attribute of every item in the main table).
//
// Overall number of item types should be limited.
export const getTypes = async (startKey?: any, limit = 200) => {
  const cmd = new ScanCommand({
    TableName: typesTable,
    ProjectionExpression: '#id',
    ExpressionAttributeNames: { '#id': 'id' },
    Limit: limit,
    ExclusiveStartKey: startKey,
  })
  const resp = await ddbDocClient.send(cmd)
  return { items: resp?.Items, lastKey: resp?.LastEvaluatedKey }
}
