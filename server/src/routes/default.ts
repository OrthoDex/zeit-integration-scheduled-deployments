import * as Koa from 'koa'
import { Context } from 'koa'

import { createApp } from '../common'

async function main(ctx: Context, next: Function) {
    ctx.status = 200
    ctx.body = 'Hello! This is the scheduled integration'
}

export default createApp((app: Koa) => {
    app.use(main)
})
