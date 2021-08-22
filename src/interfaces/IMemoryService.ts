import { Redis } from "ioredis"
import { Logger } from "winston"
import ICron from "./dependencies/ICron"
import { L2Provider } from "./ILayer"

export class MemoryService {
    protected parentLayer: L2Provider

    constructor(
        protected jobScheduler: ICron,
        protected redis: Redis,
        protected logger: Logger
    ) {
        this.jobScheduler = jobScheduler
        this.redis = redis
        this.logger = logger
    }

    public SetParentLayer(l2Provider: L2Provider): void {
        this.parentLayer = l2Provider
    }

    protected async getMembersOfSet(key: string): Promise<string[]> {
        try {
            return this.redis
            .multi()
            .smembers(key)
            .exec()
            .then((result) => {
                return result[0][1] as string[]
            })
        } catch (error) {
            this.logger.error('Error in MemoryService.getMembersOfSet: %o', error)
            throw error
        }
    }

    protected async addMembersToSet({ key, members, getMembers }: { key: string, members: string[], getMembers?: boolean }): Promise<string[] | void> {
        try {
            if (getMembers) {
                return this.redis
                    .multi()
                    .sadd(key, ...members)
                    .smembers(key)
                    .exec()
                    .then((result) => result[1][1] as string[])
            }
            await this.redis
                .multi()
                .sadd(key, ...members)
                .exec()

        } catch (error) {
            this.logger.error('Error in MemoryService.addMembersToSet: %o', error)
            throw error
        }
    }

    protected async removeMembersFromSet({ key, members, getMembersLeft }: { key: string, members: string[], getMembersLeft?: boolean }): Promise<string[] | void> {
        try {
            if (getMembersLeft) {
                return this.redis
                    .multi()
                    .srem(key, ...members)
                    .smembers(key)
                    .exec()
                    .then((result) => result[1][1] as string[])
            } else {
                await this.redis
                    .multi()
                    .srem(key, ...members)
                    .exec()
            }

        } catch (error) {
            this.logger.error('Error in MemoryService.removeMemberFromSet: %o', error)
            throw error
        }
    }

    protected async delKey(key: string): Promise<void> {
        try {
            await this.redis
                .multi()
                .del(key)
                .exec()

        } catch (error) {
            this.logger.error('Error in MemoryService.delKey: %o', error)
            throw error
        }
    }

    protected async delMemberFromHash(key: string, fields: string[]): Promise<void> {
        try {
            await this.redis
                .multi()
                .hdel(key, ...fields)
                .exec()
                
        } catch (error) {
            this.logger.error('Error in MemoryService.delKey: %o', error)
            throw error
        }
    }
}