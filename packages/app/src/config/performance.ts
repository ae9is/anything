// AWS Lambda function invocation payload limits
// ref: https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html#function-configuration-deployment-and-execution 
//  
// Currently 6MB for each synchronous request/response
// Add 10% margin of error.
//export const lambdaPayloadLimit = 6 * 1024 * 1024 * 0.90
export const lambdaPayloadLimit = 1024 // Temp limit 1KB for testing
