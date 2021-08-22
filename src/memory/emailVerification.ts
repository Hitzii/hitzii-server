import { Redis } from "ioredis"
import { Inject, Service } from "typedi"
import { Logger } from "winston"
import config from "../config"
import { L2JobScheduler } from "../decorators/jobScheduler"
import DevLogger from "../decorators/logger"
import ICron from "../interfaces/dependencies/ICron"
import { IEmailVerificationGrant, IEmailVerificationRequest } from "../interfaces/IAuthToken"
import { MemoryService } from "../interfaces/IMemoryService"
import { IUserDisplay } from "../interfaces/IUser"

@Service()
export default class EmailVerification extends MemoryService {
    constructor(
        @L2JobScheduler() jobScheduler: ICron,
        @Inject('redis') redis: Redis,
        @DevLogger() logger: Logger
    ) {
        super(jobScheduler, redis, logger)
    }

    public async Create(code: string, { _id }: Partial<IUserDisplay>, emailVerificationRequest: IEmailVerificationRequest): Promise<IEmailVerificationGrant> {
        try {
            const key = `emailVerification.grant:${code}`

            return this.redis
                .multi()
                .hmset(key, {
                    ...emailVerificationRequest,
                    user_id: _id
                })
                .expire(key, config.emailVerification.emailVerificationCodeTTL)
                .hgetall(key)
                .exec()
                .then((result) => result[2][1])

        } catch (error) {
            this.logger.error('Error in EmailVerification.Create memoryservice: %o', error)
            throw error
        }
    }

    public async GetByKey(key: string): Promise<IEmailVerificationGrant> {
        try {
            return this.redis
                .multi()
                .hgetall(key)
                .exec()
                .then((result) => {
                    if (Object.values(result[0][1]).length === 0) {
                        throw new Error('EmailVerification grant code is invalid or has expired')
                    }

                    return result[0][1]
                })
        } catch (error) {
            this.logger.error('Error in EmailVerification.GetByKey memoryservice: %o', error)
            throw error
        }
    }

    public async GetAndDeleteByKey(key: string): Promise<IEmailVerificationGrant> {
        try {
            return this.redis
                .multi()
                .hgetall(key)
                .del(key)
                .exec()
                .then((result) => {
                    if (Object.values(result[0][1]).length === 0) {
                        throw new Error('EmailVerification grant code is invalid or has expired')
                    }
                    return result[0][1]
                })

        } catch (error) {
            this.logger.error('Error in EmailVerification.GetAndDeleteByKey memoryservice: %o', error)
            throw error
        }
    }
}