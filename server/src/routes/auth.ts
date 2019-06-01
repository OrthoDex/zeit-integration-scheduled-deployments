import * as Koa from 'koa'
import { Context } from 'koa'
import * as crypto from 'crypto'

import { createApp } from '../common'
import {
    CLIENT_ID,
    CLIENT_SECRET,
    ENCRYPTION_KEY,
    ENCRYPTION_DB,
} from '../../../lib/commons'
import { redisClient } from '../../../lib/redisClient'
import { promisify } from 'util'

const setAsync = promisify(redisClient.set).bind(redisClient)

async function main(ctx: Context, cb: Function) {
    const { configurationId, teamId, code, next } = ctx.query

    const tokenRes = await fetch('https://api.zeit.co/v2/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: next,
        }),
    })
    const tokenPayload = await tokenRes.json()
    const token = tokenPayload['access_token']

    const userMetaData = JSON.stringify({
        token,
        teamId,
        configurationId,
    })

    redisClient.select(ENCRYPTION_DB)

    const algorithm = 'aes256'
    const cipher = crypto.createCipher(algorithm, ENCRYPTION_KEY)
    const encryptedMetaData =
        cipher.update(userMetaData, 'utf8', 'hex') + cipher.final('hex')
    await setAsync(`${teamId}:userMetaData`, encryptedMetaData)

    return ctx.redirect(next)
}

export default createApp((app: Koa) => {
    app.use(main)
})
