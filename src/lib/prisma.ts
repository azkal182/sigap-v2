import 'server-only'
import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma || createClient()

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
