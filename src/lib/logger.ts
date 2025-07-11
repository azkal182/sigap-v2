// import { createLogger, format, transports } from 'winston'

// const isProduction = process.env.NODE_ENV === 'production'

// const logger = createLogger({
//   level: 'info',
//   format: format.combine(
//     format.timestamp(),
//     format.printf(({ timestamp, level, message, ...meta }) => {
//       return `[${timestamp}] ${level.toUpperCase()}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
//     })
//   ),
//   transports: [
//     // Always log to console
//     new transports.Console(),

//     // Log to file only in production
//     ...(isProduction
//       ? [
//           new transports.File({ filename: 'logs/error.log', level: 'error' }),
//           new transports.File({ filename: 'logs/combined.log' })
//         ]
//       : [])
//   ]
// })

// export default logger

// src/lib/logger.node.ts
import { createLogger, format, transports } from 'winston'
import TelegramLogger from 'winston-telegram'

const isProduction = process.env.NODE_ENV === 'production'

const logger = createLogger({
  level: 'info',
  format: isProduction
    ? format.combine(format.timestamp(), format.errors({ stack: true }), format.json())
    : format.combine(
        format.colorize(),
        format.timestamp(),
        format.errors({ stack: true }),
        format.printf(({ timestamp, level, message, stack, ...meta }) => {
          return `[${timestamp}] ${level}: ${message} ${stack ?? ''} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`
        })
      ),
  transports: [
    new transports.Console(),

    ...(isProduction
      ? [
          //   new transports.File({ filename: 'logs/error.log', level: 'error' }),
          //   new transports.File({ filename: 'logs/combined.log' })
          new TelegramLogger({
            level: 'error',

            token: process.env.TELEGRAM_BOT_TOKEN!,
            chatId: Number(process.env.TELEGRAM_CHAT_ID!),

            // Optional but good to add:
            silent: false,
            disableNotification: false,
            batchingDelay: 5000,
            parseMode: 'Markdown', // or 'HTML' if you prefer

            // ✅ Template (digunakan jika formatMessage tidak digunakan)
            template: `*🚨 [{{level}}]*\n{{message}}\n\n\`\`\`{{stack}}\`\`\``,

            // ✅ Atau gunakan custom formatMessage (lebih fleksibel)
            formatMessage: ({ level, message, metadata }) => {
              const levelStr = level.toUpperCase()

              const date = new Date()

              const timeString = date.toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })

              const stack = metadata instanceof Error ? metadata.stack : metadata?.stack || ''

              const safeMessage = message.replace(/[`*_[\]()~>#+\-=|{}.!]/g, '\\$&') // escape karakter Markdown

              const safeStack = stack
                ? '```\n' + stack.slice(0, 3500) + '\n```' // Telegram limit: 4096 chars
                : ''

              return [`*🚨 ${levelStr} - ${timeString}*`, `❌ ${safeMessage}`, safeStack].filter(Boolean).join('\n\n')
            }
          })

          // 🔔 Telegram logger for error only
        ]
      : [])
  ]
})

export default logger
