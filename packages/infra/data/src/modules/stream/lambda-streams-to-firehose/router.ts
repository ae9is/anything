
export type RoutingFunction = (defaultDeliveryStreamName: string, records: (Buffer | undefined)[], callback: any) => void

/** function which will simply route records to the provided delivery stream */
export function defaultRouting(defaultDeliveryStreamName: string, records: (Buffer | undefined)[], callback: any) {
  const routingMap: { [streamName: string]: (Buffer | undefined)[] | undefined } = {}
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
export function routeToDestination(defaultDeliveryStreamName: string, records: (Buffer | undefined)[], routingFunction: RoutingFunction, callback: any) {
  routingFunction.call(undefined, defaultDeliveryStreamName, records, callback)
}
