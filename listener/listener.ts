import { redisClient as redisWatcher } from '../lib/redisClient'
import { logger } from '../lib/logging'
import { REDIS_HOST_DB, SCHEDULE_ENDPOINT } from '../lib/commons'
import * as fetch from 'node-fetch'

const redisCmdClient = redisWatcher.duplicate()

const notifyKeySpace = (userId: string, projectId: string, cb) => {
    logger.info('sending deploy notification', { userId, projectId })
    fetch(`${SCHEDULE_ENDPOINT}/api/notify`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            projectId,
            userId,
        }),
    })
        .then(res => {
            if (res.status !== 204) {
                return cb(new Error('Downstream error with deployment server'))
            }
            cb(null, res)
        })
        .catch(err => cb(err))
}

redisWatcher.on('error', err => {
    logger.error(`Failed to connect to redis. Exiting process', ${err}`)
    process.exit(0)
})

redisWatcher.on('ready', () => {
    logger.info('redis connection ready')
    redisWatcher.config('SET', 'notify-keyspace-events', 'KExe') // https://redis.io/topics/notifications
    redisWatcher.psubscribe(`__keyevent@${REDIS_HOST_DB}__:*`, (err, reply) => {
        if (err) {
            logger.error(`redis psubscribe error', ${err}`)
        }
        logger.debug('watch', { reply })
    }) // listen to keyspace events from specific db
    logger.info('Listening to keyspace events')
})

redisWatcher.on('pmessage', (pattern, channel, message) => {
    logger.info('Message Received', { pattern, channel, message })
    // use redis 'watch' for optimistic locking
    // more here: https://redis.io/topics/transactions

    // TODO: dunno if this works at scale, use https://github.com/mike-marcacci/node-redlock
    const keyList = `${message.split(':').slice(-1)[0]}`
    const projectId = keyList.split('.')[2]
    const userId = keyList.split('.')[1]

    if (!projectId || !userId) {
        logger.error('No key pattern exists. Skipping')
        return
    }
    const key = `${projectId}:${userId}:watch`
    redisCmdClient.watch(key, function(err) {
        if (err) {
            logger.error(`Watch error! Exiting pub sub', ${err}`)
            return
        }

        notifyKeySpace(userId, projectId, (err, result) => {
            if (err) {
                logger.error(`Error creating deployment!', ${err}`)
                return redisCmdClient.unwatch(() => {
                    return
                })
            }

            redisCmdClient
                .multi()
                .set(key, 'DONE')
                .exec(function(err, results) {
                    /**
                     * If err is null, it means Redis successfully attempted
                     * the operation.
                     */

                    if (err) {
                        logger.error(`Watch error! Exiting pub sub', ${err}`)
                        return
                    }

                    /**
                     * If results === null, it means that a concurrent client
                     * changed the key while we were processing it and thus
                     * the execution of the MULTI command was not performed.
                     *
                     * NOTICE: Failing an execution of MULTI is not considered
                     * an error. So you will have err === null and results === null
                     */
                    if (!results) {
                        logger.error(
                            'Watch error! Results value is null. Exiting pub sub'
                        )
                        return
                    }

                    logger.info('Deployment created!')
                    return redisCmdClient.unwatch(() => {
                        return
                    })
                })
        })
    })
})

export const start = () => {
    return redisWatcher.connected && redisCmdClient.connected
}
