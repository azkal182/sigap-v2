import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// import type { Prisma } from '@/generated/prisma'
// import { PrismaClient } from '@/generated/prisma'
// import logger from '@/lib/logger'

// const globalForPrisma = global as unknown as {
//   prisma?: PrismaClient
// }

// const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: [
//       { emit: 'event', level: 'query' },
//       { emit: 'stdout', level: 'error' },
//       { emit: 'stdout', level: 'info' },
//       { emit: 'stdout', level: 'warn' }
//     ]
//   })

// // Logging query (dev only)
// // @ts-ignore
// prisma.$on('query', (e: Prisma.QueryEvent) => {
//   if (process.env.NODE_ENV !== 'production') {
//     logger.info('Query: ' + e.query)

//     // logger.debug('Params: ' + e.params)
//     // logger.debug('Duration: ' + e.duration + 'ms')
//   }
// })

// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prisma
// }

// export default prisma
