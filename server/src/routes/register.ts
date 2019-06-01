import * as Koa from 'koa'
import { Context } from 'koa'

import { createApp } from '../common'
import { promisify } from 'util'
import { redisClient } from '../../../lib/redisClient'
import { logger } from '../../../lib/logging'

const setExAsync = promisify(redisClient.setex).bind(redisClient)

const getSecondsUntil = (untilDate: Date) => {
    const now = new Date()
    const dif = now.getTime() - untilDate.getTime()

    const secondsTTL = Math.abs(dif / 1000)
    return secondsTTL
}

async function main(ctx: Context, next: Function) {
    logger.info({ ctx })

    const { deploymentStore } = ctx.body
    try {
        const result = await setExAsync(
            `.${deploymentStore.teamId}.${deploymentStore.projectId}.`,
            getSecondsUntil(deploymentStore.timeToDeploy) + 10, // add a buffer of 10s so that we overcommit to value. This is better than undercomitting in cases where network overhead causes delays.
            JSON.stringify(deploymentStore)
        )
        if (result !== 'OK') {
            throw new Error('Redis setex not ok error')
        }
        ctx.status = 204
    } catch (error) {
        logger.error('Error ocurred pushing to redis', { error })
        ctx.status = 500
    }
}

export default createApp((app: Koa) => {
    app.use(main)
})
