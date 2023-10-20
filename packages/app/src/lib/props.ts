// React component prop types can extend Passthrough to allow passing arbitrary props to the component
export interface Passthrough {
  [x: string]: any
}

// Remove empty (null or undefined) props from an object, recursively
// ref: https://stackoverflow.com/a/38340374
export function removeEmptyProps(object: any) {
  let newObject: any = {}
  Object.keys(object).forEach((key) => {
    if (object[key] === Object(object[key])) {
      newObject[key] = removeEmptyProps(object[key])
    }
    else if (object[key] !== undefined && object[key] !== null) {
      newObject[key] = object[key]
    }
  })
  return newObject
}

// Shallowly uri encodes object props
export function encodeProps(object: any) {
  let newObject: any = {}
  Object.keys(object).forEach((key) => {
    newObject[key] = encodeURIComponent(object[key])
  })
  return newObject
}
