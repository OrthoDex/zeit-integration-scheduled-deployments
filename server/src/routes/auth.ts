import * as Koa from 'koa'
import { Context } from 'koa'
import * as crypto from 'crypto'

import { createApp } from '../common'
import {
    CLIENT_ID,
    CLIENT_SECRET,
    ENCRYPTION_KEY,
    ENCRYPTION_DB,
    SELF_URL,
} from '../../../lib/commons'
import { redisClient } from '../../../lib/redisClient'
import { promisify } from 'util'
import { logger } from '../../../lib/logging'
import * as fetch from 'node-fetch'
import { URLSearchParams } from 'url'

const setAsync = promisify(redisClient.set).bind(redisClient)
const selectAsync = promisify(redisClient.select).bind(redisClient)

async function main(ctx: Context, cb: Function) {
    logger.info('Body', { ctx })
    const { configurationId, code, next } = ctx.query

    const payload = new URLSearchParams()
    payload.append('client_id', CLIENT_ID)
    payload.append('client_secret', CLIENT_SECRET)
    payload.append('code', code)
    payload.append('redirect_uri', `${SELF_URL}/api/auth`)

    logger.debug('payload', { payload: payload.toString() })

    const tokenRes = await fetch('https://api.zeit.co/v2/oauth/access_token', {
        method: 'POST',
        body: payload,
    })
    const tokenPayload = await tokenRes.json()
    logger.debug('token', { tokenPayload })
    const token = tokenPayload['access_token']

    const userInfo = await fetch('https://api.zeit.co/www/user', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).then(res => res.json())

    logger.debug('userInfo', { userInfo })

    const { uid } = userInfo.user

    const userMetaData = JSON.stringify({
        token,
        configurationId,
        uid,
    })

    await selectAsync(ENCRYPTION_DB)

    const algorithm = 'aes256'
    const cipher = crypto.createCipher(algorithm, ENCRYPTION_KEY)
    const encryptedMetaData =
        cipher.update(userMetaData, 'utf8', 'hex') + cipher.final('hex')
    await setAsync(`${uid}:userMetaData`, encryptedMetaData)

    return ctx.redirect(next)
}

export default createApp((app: Koa) => {
    app.use(main)
})
