import { createClient } from 'redis'
import { logger } from './logging'

const {
    REDIS_HOST_URL,
    REDIS_HOST_DB = 1, // most hosted databases keep administrative info in DB 0, select db 1 to be safe
    REDIS_HOST_PASSWORD,
} = process.env

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
