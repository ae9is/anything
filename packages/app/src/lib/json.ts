import logger from 'logger'

export function stringify(value: unknown) {
  let stringified
  try {
    stringified = JSON.stringify(value)
  } catch (e) {
    logger.error(`Error stringifying ${value}`)
  }
  return stringified
}
