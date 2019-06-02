import { logger } from './logging'

import { redisAuthClient as redisClient } from './redisClient'
import { ENCRYPTION_DB, ENCRYPTION_KEY, deploymentDetails } from './commons'
import * as crypto from 'crypto'
import { promisify } from 'util'
import * as fetch from 'node-fetch'

const getAsync = promisify(redisClient.get).bind(redisClient)
const algorithm = 'aes256'

export const createApiToken = async (uid: string) => {
    try {
        redisClient.select(ENCRYPTION_DB)
        const redisVal = await getAsync(`${uid}:userMetaData`)
        const decipher = crypto.createDecipher(algorithm, ENCRYPTION_KEY)
        const decrypted =
            decipher.update(redisVal, 'hex', 'utf8') + decipher.final('utf8')

        const userMetaData = JSON.parse(decrypted)
        return userMetaData.token
    } catch (error) {
        logger.error('could not create zeit api client', { error })
        return false
    }
}

export const createDeployment = (
    userId: string,
    projectName: string,
    payload: deploymentDetails
) => {
    return createApiToken(userId).then(token => {
        if (token) {
            return fetch(payload.rawFileUrl)
                .then(res => res.text())
                .then((rawFileContent: string) => {
                    logger.debug('fileContent', { rawFileContent })
                    return fetch('https://api.zeit.co/v9/now/deployments', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            name: projectName,
                            version: 2,
                            files: [
                                {
                                    file: payload.rawFileUrl
                                        .split('/')
                                        .slice(-1)[0],
                                    data: rawFileContent,
                                },
                            ], // TODO: fill this or make dynamic
                        }),
                    }).then(res => res.json())
                })
        } else {
            throw new Error('no valid client found')
        }
    })
}
