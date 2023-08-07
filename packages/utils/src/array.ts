// Split an array (for ex of JSON objects) into chunks based on each chunk having a certain max file size.
// Flag allows including or excluding items of indeterminate size. If included, item will be in a chunk by itself.

import logger from 'logger'

// ref: https://stackoverflow.com/questions/23318037/size-of-json-object-in-kbs-mbs
function getObjectFileSize(obj: any) {
  try {
    const size = new TextEncoder().encode(JSON.stringify(obj)).length
    return size
  } catch (e) {
    logger.error('Error calculating object file size')
    logger.error(e)
  }
  return null
}

export function chunkArray(array: any[], maxChunkFileSize: number, includeUnknownSizeObjects = true) {
  let chunkIndex = 0
  let chunkSize = 0
  const chunks = array?.reduce((acc, currentItem) => {
    const itemSize = getObjectFileSize(currentItem)
    if (itemSize === null || itemSize === undefined) { 
      // If we can't determine item size, put the item in its own chunk
      if (acc[chunkIndex]) {
        // Current chunk exists so add item to next chunk
        ++chunkIndex
      }
      acc[chunkIndex] = [currentItem]
      ++chunkIndex
      chunkSize = 0
    } else {
      if (chunkSize + itemSize > maxChunkFileSize) {
        // Add to start of new chunk
        ++chunkIndex
        acc[chunkIndex] = [currentItem]
        chunkSize = itemSize
      } else {
        // Add to any existing chunk
        if (!acc[chunkIndex]) {
          acc[chunkIndex] = []
        }
        acc[chunkIndex].push(currentItem)
        chunkSize += itemSize
      }
    }
    return acc
  }, [])
  return chunks
}

// Use as array.filter(notEmpty)
// ref: https://stackoverflow.com/a/46700791
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  if (value === null || value === undefined) return false
  const testDummy: TValue = value
  return true
}
