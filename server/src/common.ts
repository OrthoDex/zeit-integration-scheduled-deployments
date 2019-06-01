import * as Koa from 'koa'
import * as koaLogger from 'koa-logger'
import * as bodyParser from 'koa-bodyparser'
import { Context } from 'koa'
import { logger } from '../../lib/logging'
import { listener } from '../../lib/listener'
const uiHooks = require('../../uiHooks')

export function createApp(main: (app: Koa) => any) {
    const app = new Koa()

    app.use(koaLogger())
    app.use(bodyParser())
    app.use(async (ctx: Context, next: Function) => {
        ctx.res.statusCode = 200
        try {
            await next()
        } catch (err) {
            logger.error(err)
            throw err
        }
    })

    main(app)

    return app.callback()
}
