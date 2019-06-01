import { redisClient } from './redisClient'
import { logger } from './logging'
import { createDeployment } from './zeitApiClient'

export const listener = redisClient.on('message', (channel, message) => {
    logger.info('Message Received', { channel, message })
    // use redis 'watch' for optimistic locking
    // more here: https://redis.io/topics/transactions

    // TODO: dunno if this works at scale, use https://github.com/mike-marcacci/node-redlock
    const projectName = `${message.split(':').slice(-1)[0]}`
    const key = `${projectName}:watch`
    redisClient.watch(key, function(err) {
        if (err) {
            logger.error('Watch error! Exiting pub sub', { err })
            return
        }

        createDeployment(projectName, (err, result) => {
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
