
/** function which will simply route records to the provided delivery stream */
export function defaultRouting(defaultDeliveryStreamName: string, records: any, callback: any) {
  const routingMap: { [streamName: string]: string } = {}
  routingMap[defaultDeliveryStreamName] = records
  callback(null, routingMap)
}

/**
 * Function to apply a routing function to a group of records
 *
 * @param defaultDeliveryStreamName
 * @param records
 * @param routingFunction
 * @param callback
 * @returns
 */
export function routeToDestination(defaultDeliveryStreamName: string, records: any, routingFunction: any, callback: any) {
  routingFunction.call(undefined, defaultDeliveryStreamName, records, callback)
}
