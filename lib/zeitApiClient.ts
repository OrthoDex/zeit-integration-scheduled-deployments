import { logger } from './logging'

import { ZeitClient } from '@zeit/integration-utils'
import { redisClient } from './redisClient'
import { ENCRYPTION_DB, ENCRYPTION_KEY } from './commons'
import * as crypto from 'crypto'
import { promisify } from 'util'

const getAsync = promisify(redisClient.get).bind(redisClient)
const algorithm = 'aes256'

export const createApiClient = async teamId => {
    try {
        redisClient.select(ENCRYPTION_DB)
        const redisVal = await getAsync(`${teamId}:userMetaData`)
        const decipher = crypto.createDecipher(algorithm, ENCRYPTION_KEY)
        const decrypted =
            decipher.update(redisVal, 'hex', 'utf8') + decipher.final('utf8')

        const userMetaData = JSON.parse(decrypted)
        const zeitClient = new ZeitClient(userMetaData)
        return zeitClient
    } catch (error) {
        logger.error('could not create zeit api client', { error })
        return false
    }
}

export const createDeployment = (
    teamId: string,
    projectName: string,
    cb: Function
) => {
    createApiClient(teamId).then(client => {
        if (client) {
            client
                .fetchAndThrow(`/v9/now/deployments`, {
                    data: {
                        name: projectName,
                        version: '2',
                        files: ['index.html'], // TODO: fill this or make dynamic
                    },
                })
                .then(res => cb(null, res))
                .catch(err => cb(err))
        } else {
            cb(new Error('no valid client found'))
        }
    })
}
