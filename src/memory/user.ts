import EventEmitter from "events";
import { Redis } from "ioredis";
import { Inject, Service } from "typedi";
import { Logger } from "winston";
import config from "../config";
import { L2EventHandler } from "../decorators/eventHandler";
import { L2JobScheduler } from "../decorators/jobScheduler";
import DevLogger from "../decorators/logger";
import ICron from "../interfaces/dependencies/ICron";
import { MemoryService } from "../interfaces/IMemoryService";
import { IUserDisplay, IUserDocDTO, IUserInMemory, IUserRecord } from "../interfaces/IUser";

@Service()
export default class User extends MemoryService {
    constructor(
        @L2EventHandler() eventDispatcher: EventEmitter,
        @L2JobScheduler() jobScheduler: ICron,
        @Inject('redis') redis: Redis,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, redis, logger)
    }

    public async Create(userDoc: IUserDocDTO): Promise<IUserRecord> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
            const userRecord = await userService.Create(userDoc)

            const key = `user:${userRecord._id}`
            const {
                firstName,
                lastName,
                email
            } = userRecord

            await this.redis
                .multi()
                .hmset(key, {
                    firstName,
                    lastName,
                    email
                } as IUserInMemory)
                .expire(key, config.user.userCacheTTL)
                .exec()
            
            return userRecord
        } catch (error) {
            this.logger.error('Error in User.Create memoryservice: %o', error)
            throw error
        }
    }

    public async GetById(_id: string): Promise<IUserDisplay> {
        try {
            const key = `user:${_id}`
            
            const userInMemory = await this.redis
                .multi()
                .hgetall(key)
                .expire(key, config.user.userCacheTTL)
                .exec()
                .then((result) => {
                    return result[0][1] as IUserInMemory
                })

            if (Object.values(userInMemory).length === 0) {
                const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
                const { firstName, lastName, email } = await userService.GetById(_id)

                await this.redis
                    .multi()
                    .hmset(key, {
                        firstName,
                        lastName,
                        email
                    } as IUserInMemory)
                    .expire(key, config.user.userCacheTTL)
                    .exec()
                
                return {
                    _id,
                    firstName,
                    lastName,
                    email
                }
            } else {
                return {
                    ...userInMemory,
                    _id
                }
            }
        } catch (error) {
            this.logger.error('Error in User.GetById memoryservice: %o', error)
            throw error
        }
    }

    // public async GetRecordById(_id: string): Promise<IUserRecord> {
    //     try {
    //         const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
    //         const userRecord = await userService.GetById(_id)
    //         return userRecord
    //     } catch (error) {
    //         this.logger.error('Error in User.GetRecordById memoryservice: %o', error)
    //         throw error
    //     }
    // }

    public async GetRecordByField(field: string, value: any): Promise<IUserRecord> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
            const userRecord = await userService.GetOneByField(field, value)
            return userRecord
        } catch (error) {
            this.logger.error('Error in User.GetRecordByField memoryservice: %o', error)
            throw error
        }
    }

    public async GetRecordById(_id: string): Promise<IUserRecord> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
            const userRecord = await userService.GetById(_id)
            return userRecord
        } catch (error) {
            this.logger.error('Error in User.GetRecordByField memoryservice: %o', error)
            throw error
        }
    }

    public async GetSessionsById(_id: string): Promise<string[]> {
        try {
            const userKey = `user:${_id}`

            return this.redis
                .multi()
                .smembers(`${userKey}:sessions`)
                .exec()
                .then((result) => {
                    if (typeof result[0][1] !== "object" || result[0][1].length === 0) {
                        throw new Error('This member has no registered sessions')
                    }

                    return result[0][1]
                })
            
        } catch (error) {
            this.logger.error('Error in User.GetSessionsById memoryservice: %o', error)
            throw error
        }
    }

    public async RegisterSessionKey(userId: string, sessionKey: string): Promise<void> {
        try {
            const userKey = `user:${userId}`

            await this.redis
                .multi()
                .exists(userKey)
                .exec()
                .then((result) => {
                    if (result[0][1] === 0) {
                        throw new Error('User not registered')
                    }
                })

            await this.redis
                .multi()
                .sadd(`${userKey}:sessions`, sessionKey)
                .exec()

        } catch (error) {
            this.logger.error('Error in User.RegisterSessionKey memoryservice: %o', error)
            throw error
        }
    }

    public async UnregisterSessionKey(userId: string, sessionKey: string): Promise<void> {
        try {
            const userKey = `user:${userId}`

            await this.redis
                .multi()
                .srem(`${userKey}:sessions`, sessionKey)
                .exec()

        } catch (error) {
            this.logger.error('Error in User.UnegisterSessionKey memoryservice: %o', error)
            throw error
        }
    }

    public async UnregisterAllSessionKeys(userId: string): Promise<void> {
        try {
            const userKey = `user:${userId}`

            await this.redis
                .multi()
                .del(`${userKey}:sessions`)
                .exec()

        } catch (error) {
            this.logger.error('Error in User.UnregisterAllSessionKeys memoryservice: %o', error)
            throw error
        }
    }

    public async UpdateSessionKey(userId: string, oldSessionKey: string, newSessionKey: string): Promise<void> {
        try {
            const userKey = `user:${userId}`

            await this.redis
                .multi()
                .srem(`${userKey}:sessions`, oldSessionKey)
                .sadd(`${userKey}:sessions`, newSessionKey)
                .exec()
                
        } catch (error) {
            this.logger.error('Error in User.UpdateSessionKey memoryservice: %o', error)
            throw error
        }
    }

    public async UpdatePersistently(_id: string, userDoc: Partial<IUserDocDTO>): Promise<IUserDisplay> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
            const userRecord = await userService.UpdateById(_id, userDoc)

            const key = `user:${userRecord._id}`
            const {
                firstName,
                lastName,
                email,
            }: IUserInMemory = userRecord
            await this.redis
                .multi()
                .hmset(key, { firstName, lastName, email } as IUserInMemory)
                .hgetall(key)
                .expire(key, config.user.userCacheTTL)
                .exec()
                .then((result) => result[1][1])
            
            return {
                _id: userRecord._id,
                firstName,
                lastName,
                email
            } as IUserDisplay

        } catch (error) {
            this.logger.error('Error in User.Update memoryservice: %o', error)
            throw error
        }
    }
}