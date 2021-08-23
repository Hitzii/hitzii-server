import { Redis } from "ioredis";
import { Inject, Service } from "typedi";
import { Logger } from "winston";
import config from "../config";
import DevLogger from "../decorators/logger";
import { MemoryService } from "../interfaces/IMemoryService";
import { IUserDocDTO, IUserInMemory, IUserRecord } from "../interfaces/IUser";
import { IMissingItems, IValidationWarning } from "../interfaces/IUtils";

@Service()
export default class User extends MemoryService {
    constructor(
        @Inject('redis') redis: Redis,
        @DevLogger() logger: Logger
    ) {
        super(redis, logger)
    }

    // Main CRUD

    public async Create(userDoc: IUserDocDTO): Promise<IUserRecord> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
            const userRecord = await userService.Create(userDoc)
            
            await this.SaveInMemory(userRecord._id, userRecord)
            
            return userRecord

        } catch (error) {
            this.logger.error('Error in User.Create memoryservice: %o', error)
            throw error
        }
    }

    public async SaveInMemory(userId: string, userDoc: Partial<IUserDocDTO>): Promise<IUserInMemory> {
        try {
            const userInMemory = this.castDocumentToInMemory(userId, userDoc)
            this.logger.debug('userInMemory is %o', userInMemory)
            let sets = {} as Partial<IUserInMemory>

            const { key, organizations } = userInMemory

            if (organizations && organizations.length > 0) {
                sets['organizations'] = await this.redis
                    .multi()
                    .sadd(`${key}:organizations`, ...organizations)
                    .expire(`${key}:organizations`, config.user.userCacheTTL)
                    .smembers(`${key}:organizations`)
                    .exec()
                    .then((result) => result[2][1] as string[])

                Reflect.deleteProperty(userInMemory, 'organizations')
            }
            
            const savedInMemory = await this.redis
                .multi()
                .hmset(key, userInMemory)
                .expire(key, config.user.userCacheTTL)
                .hgetall(key)
                .exec()
                .then((result) => result[2][1] as IUserInMemory)

            return {
                ...sets,
                ...savedInMemory,
                key
            }

        } catch (error) {
            this.logger.error('Error in User.SaveInMemory memoryservice: %o', error)
            throw error
        }
    }

    public async GetById(_id: string): Promise<IUserInMemory> {
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
            Reflect.deleteProperty(userInMemory, 'warningMessage')

            if (Object.values(userInMemory).length < 1) {
                const userRecord = await this.GetRecordById(_id)
                return this.SaveInMemory(_id, userRecord)
            }

            const organizations = await this.redis
                .multi()
                .smembers(`${key}:organizations`)
                .exec()
                .then((result) => result[0][1] as string[])

            if (organizations.length > 0) userInMemory['organizations'] = organizations

            return userInMemory

        } catch (error) {
            this.logger.error('Error in User.GetById memoryservice: %o', error)
            throw error
        }
    }

    public async GetRecordById(_id: string): Promise<IUserRecord> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
            const userRecord = await userService.GetById(_id)
            return userRecord
        } catch (error) {
            this.logger.error('Error in User.GetRecordById memoryservice: %o', error)
            throw error
        }
    }

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

    public async IsUniqueKey(field: string, value: string): Promise<boolean> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
            const userRecord = await userService.GetOneByField(field, value)

            if (!userRecord) return true
            return false

        } catch (error) {
            this.logger.error('Error in User.FindUniqueKey memoryservice: %o', error)
            throw error
        }
    }

    public async UpdatePersistently(_id: string, userDoc: Partial<IUserDocDTO>): Promise<IUserRecord> {
        try {
            this.logger.debug('The userDoc is %o', userDoc)
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
            const userRecord = await userService.UpdateById(_id, userDoc)

            await this.SaveInMemory(_id, userDoc)
            
            return userRecord

        } catch (error) {
            this.logger.error('Error in User.UpdatePersistently memoryservice: %o', error)
            throw error
        }
    }

    public async DeletePermanently(_id: string): Promise<void> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as DataServices.User
            await userService.DeleteById(_id)
            this.DeleteInMemoryById(_id)
            await this.DeleteAllWorkspaceViewKeys(_id)
            await this.DeleteWarningMessage(_id)
            await this.DeleteAllMissingItems(_id)
            
        } catch (error) {
            this.logger.error('Error in User.DeletePersistently memoryservice: %o', error)
            throw error
        }
    }

    public DeleteInMemoryById(_id: string) {
        const userKey = `user:${_id}`
        this.delKey(userKey)
    }


    // WorkspaceViews CRUD

    public async GetWorkspaceViewsById(_id: string): Promise<string[]> {
        try {
            const userKey = `user:${_id}`

            return this.redis
                .multi()
                .smembers(`${userKey}:workspaceViews`)
                .exec()
                .then((result) => {
                    if (typeof result[0][1] !== "object" || result[0][1].length === 0) {
                        throw new Error('This member has no registered workspace views')
                    }

                    return result[0][1]
                })
            
        } catch (error) {
            this.logger.error('Error in User.GetWorkspaceViewsById memoryservice: %o', error)
            throw error
        }
    }

    public async AddWorkspaceViewKeys(userId: string, workspaceViewKey: string[]): Promise<void> {
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
            
            const setKey = `${userKey}:workspaceViews`
            await this.addMembersToSet({ key: setKey, members: workspaceViewKey })

        } catch (error) {
            this.logger.error('Error in User.RegisterWorkspaceViewKey memoryservice: %o', error)
            throw error
        }
    }

    public async DeleteWorkspaceViewKeys(userId: string, workspaceViewKeys: string[]): Promise<void> {
        try {
            const setKey = `user:${userId}:workspaceViews`

            await this.removeMembersFromSet({ key: setKey, members: workspaceViewKeys })

        } catch (error) {
            this.logger.error('Error in User.DeleteWorkspaceViewKey memoryservice: %o', error)
            throw error
        }
    }

    public async DeleteAllWorkspaceViewKeys(userId: string): Promise<void> {
        try {
            const setKey = `user:${userId}:workspaceViews`

            await this.delKey(setKey)

        } catch (error) {
            this.logger.error('Error in User.DeleteAllWorkspaceViewKeys memoryservice: %o', error)
            throw error
        }
    }


    // User validation warning CRUD

    public async GetValidationWarning(_id: string): Promise<IValidationWarning> {
        try {
            const key = `user:${_id}`

            const missing_items = await this.getMembersOfSet(`${key}:missing.items`) as IMissingItems
            if (missing_items.length > 0) {
                const message = await this.redis
                    .multi()
                    .hmget(key, 'warningMessage')
                    .exec()
                    .then((result) => result[0][1][0] as string)

                return { message, missing_items }
            }

            return null

        } catch (error) {
            this.logger.error('Error in User.GetValidationWarning memoryservice: %o', error)
            throw error
        }
    }

    public async AddValidationWarning(userId: string, validationWarning: IValidationWarning): Promise<IValidationWarning> {
        try {
            const missing_items = await this.AddMissingItems(userId, validationWarning.missing_items)

            await this.AddWarningMessage(userId, validationWarning.message)

            return {
                ...validationWarning,
                missing_items
            }

        } catch (error) {
            this.logger.error('Error in User.AddValidationWarning memoryservice: %o', error)
            throw error
        }
    }

    public async AddMissingItems(userId: string, missingItems: IMissingItems): Promise<IMissingItems> {
        try {
            const key = `user:${userId}`

            const savedMissingItems = await this.addMembersToSet({
                key: `${key}:missing.items`,
                members: missingItems,
                getMembers: true }) as IMissingItems

            return savedMissingItems

        } catch (error) {
            this.logger.error('Error in User.AddMissingItems memoryservice: %o', error)
            throw error
        }
    }

    public async AddWarningMessage(userId: string, message: string): Promise<void> {
        try {
            const key = `user:${userId}`

            await this.redis
                .multi()
                .hmset(key, { warningMessage: message } as IUserInMemory)
                .exec()

        } catch (error) {
            this.logger.error('Error in User.AddWarningMessage memoryservice: %o', error)
            throw error
        }
    }

    public async DeleteMissingItems(userId: string, missingItems: IMissingItems): Promise<void> {
        try {
            const setKey = `user:${userId}:missing.items`

            await this.removeMembersFromSet({ key: setKey, members: missingItems })

        } catch (error) {
            this.logger.error('Error in User.DeleteMissingItems memoryservice: %o', error)
            throw error
        }
    }

    public async DeleteAllMissingItems(userId: string): Promise<void> {
        try {
            const setKey = `user:${userId}:missing.items`

            await this.delKey(setKey)

        } catch (error) {
            this.logger.error('Error in User.DeleteAllMissingItems memoryservice: %o', error)
            throw error
        }
    }

    public async DeleteMissingItemsAndGetItemsLeft(userId: string, missingItems: IMissingItems): Promise<IMissingItems> {
        try {
            const setKey = `user:${userId}:missing.items`

            const leftMissingItems = await this.removeMembersFromSet({ key: setKey, members: missingItems, getMembersLeft: true }) as IMissingItems
            return leftMissingItems

        } catch (error) {
            this.logger.error('Error in User.DeleteMissingItemsAndGetItemsLeft memoryservice: %o', error)
            throw error
        }
    }

    public async DeleteWarningMessage(userId: string): Promise<void> {
        try {
            const key = `user:${userId}`

            await this.delMemberFromHash(key, ['warningMessage'])

        } catch (error) {
            this.logger.error('Error in User.DeleteWarningMessage memoryservice: %o', error)
            throw error
        }
    }

    private castDocumentToInMemory(userId: string, userDoc: Partial<IUserDocDTO>): IUserInMemory {
        const { firstName, lastName, email, picture, organizations } = userDoc
        const userInMemory = {
            key: `user:${userId}`,
            firstName, lastName, email, picture
        }

        const fields = Object.keys(userInMemory)
        fields.forEach(field => {
            if (!userInMemory[field]) {
                Reflect.deleteProperty(userInMemory, field)
            }
        })
        
        if (organizations && organizations.length > 0) userInMemory['organizations'] = organizations

        return userInMemory
    }
}