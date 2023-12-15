import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { middyfy } from '../../lib/middy'
import { ORIGIN } from '../../config'

export const options = middyfy(async (event: APIGatewayProxyEventV2) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,' + 
        'X-Api-Key,X-Requested-With,Accept,Access-Control-Allow-Methods,Access-Control-Allow-Origin,' + 
        'Access-Control-Allow-Headers,X-Amz-Content-Sha256',
      'Access-Control-Allow-Origin': ORIGIN, // 'http://localhost:3000', //'https://<CLOUDFRONT_DOMAIN>.cloudfront.net',
      'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
      'Access-Control-Allow-Credentials': 'true',
    }
  }
})
