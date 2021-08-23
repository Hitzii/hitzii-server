import { Inject, Service } from "typedi";
import { Logger } from "winston";
import DevLogger from "../decorators/logger";
import IArgon2 from "../interfaces/dependencies/IArgon2";
import ICrypto from "../interfaces/dependencies/ICrypto";
import { MicroService } from "../interfaces/IMicroService";
import { IChangeUserPwd, IUserDisplay, IUserDocDTO, IUserInMemory, IUserInputDTO, IUserRecord, IUserValidation } from "../interfaces/IUser";
import { IMissingItems, IValidationWarning } from "../interfaces/IUtils";

@Service()
export default class User extends MicroService {
    @Inject('argon2')
    private argon2: IArgon2

    @Inject('crypto')
    private crypto: ICrypto

    constructor(
        @DevLogger() logger: Logger
    ) {
        super(logger)
    }

    public async CreateAccount(userDoc: Partial<IUserDocDTO>): Promise<IUserValidation> {
        try {
            if (!userDoc._id) {
                throw new Error('User ID must be pre-generated')
            }
            
            const schemaValidation = await this.validateSchema(userDoc)
            this.logger.debug('The schema validation is %o\n and the userDoc was %o', schemaValidation, userDoc)

            if (schemaValidation === null) {
                const verifiedUserDoc = userDoc as IUserDocDTO
                const userDisplay = await this.registerRecord(verifiedUserDoc)
                return {
                    user: userDisplay,
                    warning: null
                }
            }

            if (schemaValidation.missing_items.includes('email verification')) {
                const verifiedUserDoc = userDoc as IUserDocDTO
                const userDisplay = await this.registerRecord(verifiedUserDoc, schemaValidation)
                return {
                    user: userDisplay,
                    warning: schemaValidation
                }
            }

            const userDisplay = await this.preRegisterInMemory(userDoc._id, userDoc, schemaValidation)
            return {
                user: { ...userDisplay, isIncomplete: true },
                warning: schemaValidation
            }

        } catch (error) {
            this.logger.error('Error in User.CreateAccount microservice: %o', error)
            throw error
        }
    }

    public async GetDisplayData(userId: string): Promise<IUserDisplay> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userInMemory = await userService.GetById(userId)

            if (!userInMemory || Object.values(userInMemory).length < 1) {
                throw new Error('User data not found')
            }

            return this.castUserDataToDisplay(userInMemory)

        } catch (error) {
            this.logger.error('Error in User.CreateAccount microservice: %o', error)
            throw error
        }
    }

    public async GetUserValidation(userId: string): Promise<IUserValidation> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userInMemory = await userService.GetById(userId)
            const userDisplay = this.castUserDataToDisplay(userInMemory)

            const validationWarning = await userService.GetValidationWarning(userId)

            if (validationWarning) {
                return {
                    user: { ...userDisplay, isIncomplete: true },
                    warning: validationWarning
                }
            }

            return {
                user: userDisplay,
                warning: null
            }

        } catch (error) {
            this.logger.error('Error in User.GetUserValidation microservice: %o', error)
            throw error
        }
    }

    public async UpdateBasicData(userId: string, { firstName, lastName, email }: Partial<IUserInputDTO>): Promise<IUserDisplay | IUserValidation> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const validationWarning = await userService.GetValidationWarning(userId)
            let missing_items = [] as IMissingItems; let message = ''
            if (validationWarning) missing_items = validationWarning.missing_items
            let userDisplay = {} as IUserDisplay

            if (missing_items.length > 1) {
                throw new Error('User must fulfill the missing required files before editing his data')
            }

            const userInputDTO = { firstName, lastName, email }

            if (email) {
                const isUniqueEmail = await userService.IsUniqueKey('email', email)
                if (isUniqueEmail) {
                    await userService.UpdatePersistently(userId, { email, emailVerified: false })
                    Reflect.deleteProperty(userInputDTO, 'email')
                    missing_items = await userService.AddMissingItems(userId, ['email verification'])

                } else {
                    Reflect.deleteProperty(userInputDTO, 'email')
                }
            }
    
            const userInMemory = await userService.SaveInMemory(userId, userInputDTO)
            userDisplay = this.castUserDataToDisplay(userInMemory)

            if (missing_items.length > 0) {
                message = this.writeWarningMessage(missing_items)
                await userService.AddWarningMessage(userId, message)

                return {
                    user: { ...userDisplay, isIncomplete: true },
                    warning: { message, missing_items }
                }
            }

            return userDisplay

        } catch (error) {
            this.logger.error('Error in User.GetUserValidation microservice: %o', error)
            throw error
        }
    }

    public async UpdateMissingItems(userId: string, userInput: Partial<IUserInputDTO>): Promise<IUserValidation> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const missingItems = [] as IMissingItems
            const validationWarning = await userService.GetValidationWarning(userId)
            if (validationWarning) missingItems.push(...validationWarning.missing_items)
            let userDisplay = {} as IUserDisplay

            this.logger.debug('missingItems are %o', missingItems)
            if (missingItems.length < 2 || Object.values(userInput).length < 1) {
                throw new Error ('There are no missing items to fulfill.')
            }

            const { firstName, lastName, email, password } = userInput
            const completeItems = [] as IMissingItems; const stillMissingItems = [] as IMissingItems
            let message = ''

            if (firstName) {
                completeItems.push('firstName')
            }
            
            if (lastName) {
                completeItems.push('lastName')
            }

            if (email) {
                const emailIsUnique = await userService.IsUniqueKey('email', email)
                
                if (emailIsUnique) {
                    completeItems.push('email', 'email uniqueness')
                    stillMissingItems.push('email verification')
                }

                if (!emailIsUnique) Reflect.deleteProperty(userInput, 'email')
            }

            if (password) {
                completeItems.push('authMethod')
            }
            
            const userInMemory = await userService.SaveInMemory(userId, userInput)
            await userService.DeleteMissingItems(userId, completeItems)

            const itemsLeft = await userService.AddMissingItems(userId, stillMissingItems)

            if (itemsLeft.length > 0) {
                if (itemsLeft.length === 1 && itemsLeft.includes('email verification')) {
                    const salt = this.crypto.randomBytes(32) as Buffer
                    const hashedPassword = await this.argon2.hash(password, { salt })
                    const verifiedUserInput = userInput as IUserInputDTO
                    const userRecord = await userService.Create({
                        ...userInMemory,
                        ...verifiedUserInput,
                        _id: userId,
                        emailVerified: false,
                        hashedPassword,
                        salt: salt.toString('hex')
                    })
                    userDisplay = this.castUserDataToDisplay(userRecord)
                }

                message = this.writeWarningMessage(itemsLeft)
                await userService.AddWarningMessage(userId, message)
                return {
                    user: { ...userDisplay, isIncomplete: true },
                    warning: {
                        message,
                        missing_items: itemsLeft
                    }
                }
            }

            return {
                user: this.castUserDataToDisplay(userInMemory),
                warning: null
            }

        } catch (error) {
            this.logger.error('Error in User.UpdateMissingItems microservice: %o', error)
            throw error
        }
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

    public async DeleteAccountHardly(_id: string): Promise<void> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            await userService.DeletePermanently(_id)
        } catch (error) {
            this.logger.error('Error in User.DeleteAccountHardly microservice: %o', error)
            throw error
        }
    }

    private castUserDataToDisplay(userData: IUserInMemory | IUserRecord): IUserDisplay {
        const { _id } = userData as IUserRecord
        const { firstName, lastName, email, picture, organizations } = userData
        const userDisplay = { firstName, lastName, email, picture, organizations }
        if (!picture) Reflect.deleteProperty(userDisplay, 'picture')
        if (!organizations || organizations.length < 1) Reflect.deleteProperty(userDisplay, 'organizations')
        
        if(_id) {
            return {
                ...userDisplay,
                _id
            }
        }

        const { key } = userData as IUserInMemory
        return {
            ...userDisplay,
            _id: key.replace('user:', '')
        }
    }

    private async registerRecord(userDoc: IUserDocDTO, validationSchema?: IValidationWarning): Promise<IUserDisplay> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userRecord = await userService.Create(userDoc)
            
            if (validationSchema) {
                await userService.AddValidationWarning(userDoc._id, validationSchema)
            }
            
            return this.castUserDataToDisplay(userRecord)

        } catch (error) {
            this.logger.error('Error in User.registerRecord microservice: %o', error)
            throw error
        }
    }

    private async preRegisterInMemory(userId: string, userDoc: Partial<IUserDocDTO>, validationSchema: IValidationWarning): Promise<IUserDisplay> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userInMemory = await userService.SaveInMemory(userId, userDoc)
            await userService.AddValidationWarning(userId, validationSchema)

            return this.castUserDataToDisplay(userInMemory)

        } catch (error) {
            this.logger.error('Error in User.preRegisterInMemory microservice: %o', error)
            throw error
        }
    }

    private async validateSchema(userDoc: Partial<IUserDocDTO>): Promise<IValidationWarning | null> {
        try {
            this.logger.debug('The userDoc when validating is %o', userDoc)
            const { firstName, lastName, email, emailVerified, hashedPassword, salt, openID } = userDoc
            const missing_items = []

            if (!firstName) missing_items.push('firstName')
            if (!lastName) missing_items.push('lastName')
            if (!email) missing_items.push('email')
            if (!((hashedPassword && salt) || openID)) missing_items.push('authMethod')

            
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const isUniqueEmail = await userService.IsUniqueKey('email', email)

            if (email) {
                if (!isUniqueEmail) {
                    missing_items.push('email', 'email uniqueness')
                } else if (!emailVerified) {
                    missing_items.push('email verification')
                }
    
                if (missing_items.length > 0) {
                    return {
                        message: this.writeWarningMessage(missing_items),
                        missing_items
                    }
                }
            }

            return null
            
        } catch (error) {
            this.logger.error('Error in User.validateSchema microservice: %o', error)
            throw error
        }
    }

    private writeWarningMessage(missing_items: IMissingItems): string {
        let message = ''

        if (
            missing_items.includes('firstName')
            || missing_items.includes('lastName')
            || missing_items.includes('email')
            || missing_items.includes('authMethod')
        ) message += 'Missing required fields. '

        if (missing_items.includes('email uniqueness')) message += 'Primary email address is already in use. '

        if (missing_items.includes('email verification')) message += 'Email address requires verification. '

        return message
    }
}