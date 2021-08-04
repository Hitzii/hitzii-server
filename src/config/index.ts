import dotenv from 'dotenv'

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const envFound = dotenv.config()
if (envFound.error) {
    throw new Error("Couldn't find .env file")
}

export default {
    port: parseInt(process.env.PORT, 10),
    databaseURL: process.env.MONGODB_URI,
    debugNamespace: process.env.DEBUG_NAMESPACE,
    jwtSecret: process.env.JWT_SECRET,
    jwtAlgorithm: process.env.JWT_ALGO,
    logs: {
        level: process.env.LOG_LEVEL || 'silly',
    },
    api: {
        prefix: '/api/v1'
    },
    auth: {
        authCodeTTL: parseInt(process.env.AUTH_CODE_TTL, 10),
        accessTokenExp: parseInt(process.env.ACCESS_TOKEN_EXP, 10),
        refreshTokenExp: parseInt(process.env.REFRESH_TOKEN_EXP, 10)
    },
    user: {
        userCacheTTL: parseInt(process.env.USER_CACHE_TTL, 10)
    },
    client: {
        id: process.env.CLIENT_ID,
        secret: process.env.CLIENT_SECRET,
        realm: process.env.CLIENT_REALM,
        redirect_uri: process.env.CLIENT_REDIRECT_URI
    }
}