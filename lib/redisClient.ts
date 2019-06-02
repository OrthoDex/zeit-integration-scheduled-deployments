import { createClient } from 'redis'
import {
    REDIS_HOST_DB,
    REDIS_HOST_PASSWORD,
    REDIS_HOST_URL,
    ENCRYPTION_DB,
} from './commons'

if (!REDIS_HOST_URL) {
    throw new Error('Redis Host URL Needed')
}

export const redisClient = createClient(REDIS_HOST_URL, {
    password: REDIS_HOST_PASSWORD || '',
    db: REDIS_HOST_DB,
})

export const redisAuthClient = createClient(REDIS_HOST_URL, {
    password: REDIS_HOST_PASSWORD || '',
    db: ENCRYPTION_DB,
})
