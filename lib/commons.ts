export const {
    REDIS_HOST_URL,
    REDIS_HOST_DB = 1, // most hosted databases keep administrative info in DB 0, select db 1 to be safe
    REDIS_HOST_PASSWORD = '',
    SCHEDULE_ENDPOINT,
    CLIENT_ID,
    CLIENT_SECRET,
    SELF_URL,
    ENCRYPTION_KEY, // SUPER IMPORTANT, this is used to encrypt the oauth tokens in redis
    ENCRYPTION_DB = 3,
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
