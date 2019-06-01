import { logger } from './logging'
import { ZeitClient } from '@zeit/integration-utils'

export const createApiClient = () => {
    try {
        const userMetaData = JSON.parse(process.env.USER_METADATA)
        const zeitClient = new ZeitClient(userMetaData)
        return zeitClient
    } catch (error) {
        logger.error('could not create zeit api client', { error })
        return false
    }
}

export const createDeployment = (projectName: string, cb: Function) => {
    const client = createApiClient()
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
        cb(new Error('could not connect to zeit client'))
    }
}
