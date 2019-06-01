import * as Koa from 'koa'
import { Context } from 'koa'

import { createApp } from '../common'
import { promisify } from 'util'
import { redisClient } from '../../../lib/redisClient'
import { logger } from '../../../lib/logging'
import { deploymentStore } from '../../../lib/commons'

const deleteAsync = promisify(redisClient.del)

async function main(ctx: Context, next: Function) {
    logger.info({ ctx })

    const { deploymentStore } = ctx.body
    try {
        const result = await deleteAsync(deploymentStore.project.name)
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
