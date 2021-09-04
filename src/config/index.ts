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
    timezone: process.env.TIMEZONE,
    auth: {
        authCodeTTL: parseInt(process.env.AUTH_CODE_TTL, 10),
        accessTokenExp: parseInt(process.env.ACCESS_TOKEN_EXP, 10),
        refreshTokenExp: parseInt(process.env.REFRESH_TOKEN_EXP, 10)
    },
    recovery: {
        recoveryCodeTTL: parseInt(process.env.RECOVERY_CODE_TTL, 10)
    },
    emailVerification: {
        emailVerificationCodeTTL: parseInt(process.env.EMAIL_VERIFICATION_CODE_TTL, 10)
    },
    user: {
        userCacheTTL: parseInt(process.env.USER_CACHE_TTL, 10)
    },
    SMTP: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
        mailFrom: process.env.SMTP_MAIL_FROM
    },
    client: {
        id: process.env.CLIENT_ID,
        secret: process.env.CLIENT_SECRET,
        realm: process.env.CLIENT_REALM,
        redirect_uri: process.env.CLIENT_REDIRECT_URI
    },
    google: {
        id: process.env.GOOGLE_ID,
        secret: process.env.GOOGLE_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        default_scope: process.env.GOOGLE_DEFAULT_SCOPE.replace('-', ' ')
    },
    facebook: {
        id: process.env.FACEBOOK_ID,
        secret: process.env.FACEBOOK_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        default_scope: process.env.FACEBOOK_DEFAULT_SCOPE.replace('-', ' ')
    },
    redis:{
        uri: process.env.REDIS_URI || "localhost",
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    }
}