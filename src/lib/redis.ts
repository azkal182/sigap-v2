import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),

  //   password:
  //     process.env.REDIS_PASSWORD || 'NA54h1C8iMNylvrGxek3tqhKMszcglL/CMDysi4/3l0R1gETCt1nNuhW8/1nDpkWI5aNewDkOJlsMFUr',

  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  retryStrategy: times => {
    // times = berapa kali sudah mencoba reconnect
    return Math.min(times * 100, 2000) // jeda retry dalam ms
  }
})

redis.on('connect', () => {
  console.log('Connected to Redis')
})

redis.on('error', err => {
  console.error('Redis connection error:', JSON.stringify(err, null, 2))
})

export { redis }
