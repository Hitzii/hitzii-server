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
import { ISessionDisplay, ISessionInMemory } from "../interfaces/ISession";

@Service()
export default class Session extends MemoryService {
    constructor(
        @L2EventHandler() eventDispatcher: EventEmitter,
        @L2JobScheduler() jobScheduler: ICron,
        @Inject('redis') redis: Redis,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, redis, logger)
    }

    public async Create(session: ISessionInMemory): Promise<ISessionDisplay> {
        try {
            const { key, user, workspaceViews, connection } = session

            const userSession = await this.redis
                .multi()
                .hmset(key, {
                    user,
                    connection
                } as ISessionInMemory)
                .expire(key, config.auth.accessTokenExp)
                .hgetall(key)
                .exec()
                .then((result) => result[2][1])

            const userService = this.parentLayer.GetService('user') as MemoryServices.User
            this.eventDispatcher.emit('sessionCreated', async () => {
                await userService.RegisterSessionKey(user, key)
            })

            if (workspaceViews && workspaceViews.length !== 0) {
                const workspaceKey = `${key}:workspaceViews`
                const sessionWithViews = await this.redis
                    .multi()
                    .sadd(workspaceKey, workspaceViews)
                    .expire(workspaceKey, config.auth.accessTokenExp)
                    .smembers(workspaceKey)
                    .exec()
                    .then((result) => {
                        return {
                            user,
                            workspaceViews: result[2][1],
                            connection
                        } as ISessionDisplay
                    })
                return sessionWithViews
            }

            return userSession

        } catch (error) {
            this.logger.error('Error in Session.Create memoryservice: %o', error)
            throw error
        }
    }

    public async RenameKeys(oldKey: string, newKey: string): Promise<void> {
        try {
            let hasViews: boolean
            const session = await this.redis
                .multi()
                .rename(oldKey, newKey)
                .exists(`${oldKey}:workspaceViews`)
                .hgetall(newKey)
                .exec()
                .then((result) => {
                    if (result[0][0]) {
                        throw new Error('Error refreshing token. This session has already been refreshed or ended')
                    }

                    if (result[1][1]) {
                        hasViews = true
                    }

                    return result[2][1] as ISessionInMemory
                })
            
            if (hasViews) {
                await this.redis
                    .multi()
                    .rename(`${oldKey}:workspaceViews`, `${newKey}:workspaceViews`)
                    .exec()
            }

            const userService = this.parentLayer.GetService('user') as MemoryServices.User
            this.eventDispatcher.emit('sessionRefreshed', async () => {
                await userService.UpdateSessionKey(session.user, oldKey, newKey)
            })

        } catch (error) {
            this.logger.error('Error in Session.RenameKeys memoryservice: %o', error)
            throw error
        }
    }

    public async DeleteByKey(key: string): Promise<void> {
        try {
            const session = await this.redis
                .multi()
                .exists(key)
                .hgetall(key)
                .del(key)
                .del(`${key}:workspaceViews`)
                .exec()
                .then((result) => {
                    this.logger.debug('The result of deleting token is \n%o', result)

                    if (result[0][1] === 0) {
                        throw new Error('Error revoking token. Active session not found')
                    }

                    return result[1][1] as ISessionInMemory
                })

            const userService = this.parentLayer.GetService('user') as MemoryServices.User
            this.eventDispatcher.emit('sessionClosed', async () => {
                await userService.UnregisterSessionKey(session.user, key)
            })

        } catch (error) {
            this.logger.error('Error in Session.DeleteByKey memoryservice: %o', error)
            throw error
        }
    }

    public async DeleteAllByUserId(userId: string): Promise<void> {
        try {
            const userService = this.parentLayer.GetService('user') as MemoryServices.User
            const userSessions = await userService.GetSessionsById(userId)
            const sessionsWithViews = userSessions.map(sessionKey => `${sessionKey}:workspaceViews`)

            await this.redis
                .multi()
                .unlink(...userSessions)
                .unlink(...sessionsWithViews)
                .exec()

            this.eventDispatcher.emit('allSessionsClosed', async () => {
                await userService.UnregisterAllSessionKeys(userId)
            })

        } catch (error) {
            this.logger.error('Error in Session.DeleteAllByUserId memoryservice: %o', error)
            throw error
        }
    }
}