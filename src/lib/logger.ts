import { createLogger, format, transports } from 'winston'

const isProduction = process.env.NODE_ENV === 'production'

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
    })
  ),
  transports: [
    // Always log to console
    new transports.Console(),

    // Log to file only in production
    ...(isProduction
      ? [
          new transports.File({ filename: 'logs/error.log', level: 'error' }),
          new transports.File({ filename: 'logs/combined.log' })
        ]
      : [])
  ]
})

export default logger
