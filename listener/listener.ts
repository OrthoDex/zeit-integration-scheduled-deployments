import { redisClient } from '../lib/redisClient'
import { logger } from '../lib/logging'
import { REDIS_HOST_DB, SCHEDULE_ENDPOINT } from '../lib/commons'

redisClient.on('error', err => {
    logger.error('Failed to connect to redis. Exiting process', { err })
    process.exit(0)
})

redisClient.on('ready', () => {
    redisClient.config('SET', 'notify-keyspace-events', 'KExe') // https://redis.io/topics/notifications
    redisClient.psubscribe(`__key${REDIS_HOST_DB}__:*`) // listen to keyspace events from specific db
})

const notifyKeySpace = (userId: string, projectId: string, cb) => {
    fetch(`${SCHEDULE_ENDPOINT}/api/notify`, {
        method: 'POST',
        body: JSON.stringify({
            projectId,
            userId,
        }),
    })
        .then(res => cb(null, res))
        .then(err => cb(err))
}

export const listener = redisClient.on('message', (channel, message) => {
    logger.info('Message Received', { channel, message })
    // use redis 'watch' for optimistic locking
    // more here: https://redis.io/topics/transactions

    // TODO: dunno if this works at scale, use https://github.com/mike-marcacci/node-redlock
    const keyList = `${message.split(':').slice(-1)[0]}`
    const projectId = keyList.split('.')[2]
    const userId = keyList.split('.')[1]
    const key = `${projectId}:${userId}:watch`
    redisClient.watch(key, function(err) {
        if (err) {
            logger.error('Watch error! Exiting pub sub', { err })
            return
        }

        notifyKeySpace(userId, projectId, (err, result) => {
            if (err) {
                logger.error('Error creating deployment!', { err })
                return redisClient.unwatch(() => {
                    return
                })
            }

            redisClient
                .multi()
                .set(key, 'DONE')
                .exec(function(err, results) {
                    /**
                     * If err is null, it means Redis successfully attempted
                     * the operation.
                     */

                    if (err) {
                        logger.error('Watch error! Exiting pub sub', { err })
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
                })
        })
    })
})
