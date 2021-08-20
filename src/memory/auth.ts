import EventEmitter from "events"
import { Redis } from "ioredis"
import { Inject, Service } from "typedi"
import { Logger } from "winston"
import config from "../config"
import { L2EventHandler } from "../decorators/eventHandler"
import { L2JobScheduler } from "../decorators/jobScheduler"
import DevLogger from "../decorators/logger"
import { IAuthGrant, IAuthRequest } from "../interfaces/IAuthToken"
import ICron from "../interfaces/dependencies/ICron"
import { MemoryService } from "../interfaces/IMemoryService"
import { IUserDisplay } from "../interfaces/IUser"

@Service()
export default class Auth extends MemoryService {
    constructor(
        @L2EventHandler() eventDispatcher: EventEmitter,
        @L2JobScheduler() jobScheduler: ICron,
        @Inject('redis') redis: Redis,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, redis, logger)
    }

    public async Create(code: string, { _id }: Partial<IUserDisplay>, authRequest: IAuthRequest): Promise<IAuthGrant> {
        try {
            const key = `auth.grant:${code}`

            if (authRequest.grant_type === "authorization_code") {
                return this.redis
                    .multi()
                    .hmset(key, {
                        ...authRequest,
                        user_id: _id
                    } as IAuthGrant)
                    .expire(key, config.auth.authCodeTTL)
                    .hgetall(key)
                    .exec()
                    .then((result) => result[2][1])
            }

            if (authRequest.grant_type === "refresh_token") {
                return this.redis
                    .multi()
                    .hmset(key, {
                        ...authRequest,
                        user_id: _id
                    } as IAuthGrant)
                    .expire(key, config.auth.refreshTokenExp)
                    .hgetall(key)
                    .exec()
                    .then((result) =>result[2][1])
            }

        } catch (error) {
            this.logger.error('Error in Auth.Create memoryservice: %o', error)
            throw error
        }
    }

    public async GetByKey(key: string): Promise<IAuthGrant> {
        try {
            return this.redis
                .multi()
                .hgetall(key)
                .exec()
                .then((result) => {
                    if (Object.values(result[0][1]).length === 0) {
                        throw new Error('Authorization grant code is invalid or has expired')
                    }

                    return result[0][1]
                })
        } catch (error) {
            this.logger.error('Error in Auth.GetByKey memoryservice: %o', error)
            throw error
        }
    }

    public async GetAndDeleteByKey(key: string): Promise<IAuthGrant> {
        try {
            return this.redis
                .multi()
                .hgetall(key)
                .del(key)
                .exec()
                .then((result) => {
                    if (Object.values(result[0][1]).length === 0) {
                        throw new Error('Authorization grant code is invalid or has expired')
                    }
                    return result[0][1]
                })

        } catch (error) {
            this.logger.error('Error in Auth.GetAndDeleteByKey memoryservice: %o', error)
            throw error
        }
    }
}