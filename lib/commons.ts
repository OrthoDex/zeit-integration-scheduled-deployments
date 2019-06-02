export const {
    REDIS_HOST_URL, // redis host to connect to
    REDIS_HOST_DB = 1, // most hosted databases keep administrative info in DB 0, select db 1 to be safe
    REDIS_HOST_PASSWORD = '', // redis password in case of auth
    SCHEDULE_ENDPOINT, // endpoint to call when a deployment is scheduled
    CLIENT_ID, // oauth client id of the integration
    CLIENT_SECRET, // oauth client secret of the integration
    SELF_URL, // self url for the app
    ENCRYPTION_KEY, // SUPER IMPORTANT, this is used to encrypt the oauth tokens in redis
    ENCRYPTION_DB = 3, // change this if needed
} = process.env

if (!SCHEDULE_ENDPOINT) {
    console.error(
        'No scheduling endpoint server specified. Please contact the developer.'
    )
    process.exit(0)
}

export const redisConfig: any = {
    redisHostUrl: '',
    redisHostPassword: '',
    redisHostDb: '',
}

export type deploymentDetails = {
    projectId: string
    rawFileUrl: string
    timeToDeploy: string
    teamId: string
    userId: string
}

export const deploymentDetails: deploymentDetails = {
    projectId: '',
    rawFileUrl: '',
    timeToDeploy: '', // in UTC timestamp
    teamId: '',
    userId: '',
}

export type deploymentConfig = {
    deploymentStores: Array<deploymentDetails>
}

export const deploymentConfig = {
    deploymentStores: [deploymentDetails],
}
