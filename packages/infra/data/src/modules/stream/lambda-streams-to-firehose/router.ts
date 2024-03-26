
export type RoutingFunction = (defaultDeliveryStreamName: string, records: Buffer[]) => RoutingMap
export type RoutingMap = { [streamName: string]: Buffer[] }

/** function which will simply route records to the provided delivery stream */
export function defaultRouting(defaultDeliveryStreamName: string, records: Buffer[]) {
  const routingMap: RoutingMap = {}
  routingMap[defaultDeliveryStreamName] = records
  return routingMap
}

/**
 * Function to apply a routing function to a group of records
 *
 * @param defaultDeliveryStreamName
 * @param records
 * @param routingFunction
 */
export function routeToDestination(defaultDeliveryStreamName: string, records: Buffer[], routingFunction: RoutingFunction) {
  const routingMap = routingFunction.call(undefined, defaultDeliveryStreamName, records)
  return routingMap
}
