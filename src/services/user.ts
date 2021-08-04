import { EventEmitter } from "stream";
import { Inject, Service } from "typedi";
import { Logger } from "winston";
import { L3EventHandler } from "../decorators/eventHandler";
import { L3JobScheduler } from "../decorators/jobScheduler";
import DevLogger from "../decorators/logger";
import IArgon2 from "../interfaces/dependencies/IArgon2";
import ICron from "../interfaces/dependencies/ICron";
import ICrypto from "../interfaces/dependencies/ICrypto";
import { MicroService } from "../interfaces/IMicroService";
import { IChangeUserPwd } from "../interfaces/IUser";

@Service()
export default class User extends MicroService {
    @Inject('argon2')
    private argon2: IArgon2

    @Inject('crypto')
    private crypto: ICrypto

    constructor(
        @L3EventHandler() eventDispatcher: EventEmitter,
        @L3JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, logger)
    }

    public async ChangePassword(userId: string, { current_password, new_password }: IChangeUserPwd): Promise<void> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userRecord = await userService.GetRecordById(userId)

            if (!userRecord) {
                throw new Error('User not registered')
            }

            if (!userRecord.hashedPassword) {
                throw new Error('Changing password is only available for users with local credentials')
            }

            const validPassword = await this.argon2.verify(userRecord.hashedPassword, current_password)
            if (validPassword) {
                const salt = this.crypto.randomBytes(32) as Buffer
                const hashedPassword = await this.argon2.hash(new_password, { salt })

                await userService.UpdatePersistently(userId, {
                    hashedPassword,
                    salt: salt.toString('hex')
                })
            } else {
                throw new Error('Invalid password')
            }
        } catch (error) {
            this.logger.error('Error in User.ChangePassword microservice: %o', error)
            throw error
        }
    }
}