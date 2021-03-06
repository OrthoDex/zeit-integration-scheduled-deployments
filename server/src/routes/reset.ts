import * as Koa from 'koa'
import { Context } from 'koa'

import { createApp } from '../common'
import { promisify } from 'util'
import { redisClient } from '../../../lib/redisClient'
import { logger } from '../../../lib/logging'
const deleteAsync = promisify(redisClient.del).bind(redisClient)

async function main(ctx: Context, next: Function) {
    logger.info('ctx', { ctx })

    const { projectId, userId } = ctx.body
    try {
        const result = await deleteAsync(`.${userId}.${projectId}.`)
        if (result !== 'OK') {
            throw new Error('Redis setex not ok error')
        }
        ctx.status = 204
    } catch (error) {
        logger.error(`Error ocurred pushing to redis', ${error}`)
        ctx.status = 500
    }
}

export default createApp((app: Koa) => {
    app.use(main)
})
