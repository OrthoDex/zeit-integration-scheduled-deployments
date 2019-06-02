import * as Koa from 'koa'
import { Context } from 'koa'

import { createApp } from '../common'
import { promisify } from 'util'
import { redisClient } from '../../../lib/redisClient'
import { logger } from '../../../lib/logging'
import { createDeployment } from '../../../lib/zeitApiClient'
import { deploymentDetails } from '../../../lib/commons'

const getAsync = promisify(redisClient.get).bind(redisClient)

async function main(ctx: Context, next: Function) {
    logger.info('body', { ctx })

    const { projectId, userId } = ctx.request.body
    try {
        const stringPayload = await getAsync(`.${userId}.${projectId}.payload`)
        const payload: deploymentDetails = JSON.parse(stringPayload)
        const res = await createDeployment(userId, projectId, payload)
        logger.debug('zeit api response', { res })
        ctx.status = 204
    } catch (error) {
        console.error(error)
        logger.error(`Error ocurred creating deployment', ${error}`)
        ctx.status = 500
    }
}

export default createApp((app: Koa) => {
    app.use(main)
})
