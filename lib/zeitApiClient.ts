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

export const createDeployment = async (
    userId: string,
    projectId: string,
    payload: deploymentDetails
) => {
    try {
        const token = await createApiToken(userId)
        if (!token) {
            throw new Error(`No token found for user ${userId}`)
        }
        const projectName: string = await fetch(
            `https://api.zeit.co/v1/projects/${projectId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
            .then(res => res.json())
            .then(projectDetails => projectDetails.name)

        const rawFileContent = await fetch(payload.rawFileUrl).then(res =>
            res.text()
        )

        const fileName = payload.rawFileUrl.split('/').slice(-1)[0]

        logger.debug('fileContent', { rawFileContent, fileName })
        const deployResponse = await fetch(
            'https://api.zeit.co/v9/now/deployments',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: projectName,
                    version: 2,
                    files: [
                        {
                            file: fileName,
                            data: rawFileContent,
                        },
                    ],
                }),
            }
        ).then(res => res.json())
        logger.debug('deployment response', { deployResponse })
        // todo check if ready and alias to latest
        return deployResponse
    } catch (error) {
        logger.error('error in creating deployment', { error })
        throw error
    }
}
