export const SCHEDULE_ENDPOINT = process.env.SCHEDULE_ENDPOINT

if (!SCHEDULE_ENDPOINT) {
    console.error(
        'No scheduling endpoint server specified. Please contact the developer.'
    )
    process.exit(0)
}

export const redisConfig = {
    redisHostUrl: '',
    redisHostPassword: '',
    redisHostDb: '',
}

export type deploymentStore = {
    project: {
        name: string
        gitUrl: string
        timeToDeploy: string
    }
}

export const deploymentDetails = {
    name: '',
    gitUrl: '',
    timeToDeploy: '', // in UTC timestamp
}

export const deploymentStore: deploymentStore = {
    project: deploymentDetails,
}

export type deploymentConfig = {
    deploymentStores: Array<deploymentStore>
}

export const deploymentConfig = {
    deploymentStores: [deploymentStore],
}
