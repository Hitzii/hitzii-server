import EventEmitter from "events"
import { Redis } from "ioredis"
import { Inject, Service } from "typedi"
import { Logger } from "winston"
import config from "../config"
import { L2EventHandler } from "../decorators/eventHandler"
import { L2JobScheduler } from "../decorators/jobScheduler"
import DevLogger from "../decorators/logger"
import ICron from "../interfaces/dependencies/ICron"
import { IRecoveryGrant, IRecoveryRequest } from "../interfaces/IAuthToken"
import { MemoryService } from "../interfaces/IMemoryService"
import { IUserDisplay } from "../interfaces/IUser"

@Service()
export default class Recovery extends MemoryService {
    constructor(
        @L2EventHandler() eventDispatcher: EventEmitter,
        @L2JobScheduler() jobScheduler: ICron,
        @Inject('redis') redis: Redis,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, redis, logger)
    }

    public async Create(code: string, { _id }: Partial<IUserDisplay>, recoveryRequest: IRecoveryRequest): Promise<IRecoveryGrant> {
        try {
            const key = `recovery.grant:${code}`

            return this.redis
                .multi()
                .hmset(key, {
                    ...recoveryRequest,
                    user_id: _id
                })
                .expire(key, config.recovery.recoveryCodeTTL)
                .hgetall(key)
                .exec()
                .then((result) => result[2][1])

        } catch (error) {
            this.logger.error('Error in Recovery.Create memoryservice: %o', error)
            throw error
        }
    }

    public async GetByKey(key: string): Promise<IRecoveryGrant> {
        try {
            return this.redis
                .multi()
                .hgetall(key)
                .exec()
                .then((result) => {
                    if (Object.values(result[0][1]).length === 0) {
                        throw new Error('Recovery grant code is invalid or has expired')
                    }

                    return result[0][1]
                })
        } catch (error) {
            this.logger.error('Error in Recovery.GetByKey memoryservice: %o', error)
            throw error
        }
    }

    public async GetAndDeleteByKey(key: string): Promise<IRecoveryGrant> {
        try {
            return this.redis
                .multi()
                .hgetall(key)
                .del(key)
                .exec()
                .then((result) => {
                    if (Object.values(result[0][1]).length === 0) {
                        throw new Error('Recovery grant code is invalid or has expired')
                    }
                    return result[0][1]
                })

        } catch (error) {
            this.logger.error('Error in Recovery.GetAndDeleteByKey memoryservice: %o', error)
            throw error
        }
    }
}