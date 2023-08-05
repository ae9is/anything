/**
 * Custom errors that just work with Typescript.
 *
 * Create custom error classes by extending CustomError instead of Error.
 * For ex:
 *
 * class MyCustomError extends CustomError {}
 *
 * try {
 *   ...
 * } catch (e) {
 *   if (e instanceof MyCustomError) {
 *     ...
 *   }
 * }
 *
 * ref: https://stackoverflow.com/a/48342359/131120
 * ref: https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
 */

export class CustomError extends Error {
  constructor(message?: string) {
    // 'Error' breaks prototype chain here
    super(message)

    // restore prototype chain
    const actualProto = new.target.prototype

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto)
    } else {
      // @ts-ignore
      this.__proto__ = actualProto
    }
  }
}
