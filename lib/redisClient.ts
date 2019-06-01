import { createClient } from 'redis'
import { logger } from './logging'
import { REDIS_HOST_DB, REDIS_HOST_PASSWORD, REDIS_HOST_URL } from './commons'

if (!REDIS_HOST_URL) {
    throw new Error('Redis Host URL Needed')
}

export const redisClient = createClient(REDIS_HOST_URL, {
    password: REDIS_HOST_PASSWORD || '',
    db: REDIS_HOST_DB,
})

redisClient.on('error', err => {
    logger.error('Failed to connect to redis. Exiting process', { err })
    process.exit(0)
})

redisClient.on('ready', () => {
    redisClient.config('SET', 'notify-keyspace-events', 'KExe') // https://redis.io/topics/notifications
    redisClient.psubscribe(`__key${REDIS_HOST_DB}__:*`) // listen to keyspace events from specific db
})
