import logger from 'logger'

export function parse(value: string) {
  let parsed
  try {
    parsed = JSON.parse(value)
  } catch (e) {
    logger.error(`Error parsing ${value}`)
  }
  return parsed
}

export function stringify(value: unknown) {
  let stringified
  try {
    stringified = JSON.stringify(value)
  } catch (e) {
    logger.error(`Error stringifying ${value}`)
  }
  return stringified
}