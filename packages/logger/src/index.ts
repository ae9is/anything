class Logger {
  log(...args: any[]) {
    console.log.apply(console, args)
  }

  error(...args: any[]) {
    console.error.apply(console, args)
  }

  debug(...args: any[]) {
    console.debug.apply(console, args)
  }
}

const logger = new Logger()

export default logger
