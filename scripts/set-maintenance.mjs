// scripts/set-maintenance.mjs
import Redis from 'ioredis'

const mode = process.argv[2] // 'on' | 'off'

if (!['on', 'off'].includes(mode)) {
  console.error('Usage: node scripts/set-maintenance.mjs [on|off]')
  process.exit(1)
}

const { REDIS_HOST, REDIS_PORT = '6379', REDIS_PASSWORD } = process.env

const redis = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD || undefined
})

try {
  const KEY = 'maintenance:enabled'

  if (mode === 'on') {
    await redis.set(KEY, '1', 'EX', 1800)
    console.log('Maintenance ON (TTL 1800s)')
  } else {
    await redis.del(KEY)
    console.log('Maintenance OFF')
  }
} catch (err) {
  console.error(err)
  process.exit(1)
} finally {
  redis.disconnect()
}
