import { EventEmitter } from "events"
import { Inject, Service } from "typedi"
import { Logger } from "winston"
import { L3EventHandler } from "../decorators/eventHandler"
import { L3JobScheduler } from "../decorators/jobScheduler"
import DevLogger from "../decorators/logger"
import { IAccessToken, IAuthorizationCode, IAuthRequest, IAuthToken, IRefreshToken, IResetToken, ITokenExchangeInput } from "../interfaces/IAuthToken"
import ICron from "../interfaces/dependencies/ICron"
import { MicroService } from "../interfaces/IMicroService"
import { IResetUserPwd, IUserDisplay, IUserInputDTO, IUserNameDTO, IUserRecord } from "../interfaces/IUser"
import Memory from "../memory"
import config from "../config"
import IBSON from "../interfaces/dependencies/IBSON"
import IArgon2 from "../interfaces/dependencies/IArgon2"
import ICrypto from "../interfaces/dependencies/ICrypto"
import IJWT from "../interfaces/dependencies/IJWT"

@Service()
export default class Auth extends MicroService {
    l2Provider: Memory

    @Inject('bson')
    private bson: IBSON

    @Inject('argon2')
    private argon2: IArgon2

    @Inject('crypto')
    private crypto: ICrypto

    @Inject('jwt')
    private jwt: IJWT

    constructor(
        @L3EventHandler() eventDispatcher: EventEmitter,
        @L3JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, logger)
    }
    
    public async SignUp(userInput: IUserInputDTO, authRequest: IAuthRequest): Promise<IAuthorizationCode> {
        try {
            const salt = this.crypto.randomBytes(32) as Buffer

            this.logger.silly('Hashing password')
            const hashedPassword = await this.argon2.hash(userInput.password, { salt })
            
            this.logger.silly('Creating user DB record')
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const { firstName, lastName, email } = userInput
            const userRecord = await userService.Create({
                firstName,
                lastName,
                email,
                hashedPassword,
                salt: salt.toString('hex')
            })

            if (!userRecord) {
                throw new Error('User cannot be created')
            }

            this.eventDispatcher.emit('userSignUp', userRecord)

            this.logger.silly('Issuing authorization code')
            // return this.issueAuthCode(userRecord, authRequest)
            const authCode = await this.issueAuthCode(userRecord, authRequest)
            this.eventDispatcher.emit('authCodeIssued', authCode)
            return authCode

        } catch( error) {
            this.logger.error('Error in Auth.SignUp microservice: %o', error)
            throw error
        }
    }

    public async SignIn({ email, password }: Partial<IUserInputDTO>, authRequest: IAuthRequest): Promise<IAuthorizationCode> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userRecord = await userService.GetRecordByField('email', email)

            if (!userRecord) {
                throw new Error('User no registered')
            }

            this.logger.silly('Validating password')
            const validPassword = await this.argon2.verify(userRecord.hashedPassword, password)

            if (!validPassword) {
                throw new Error('Invalid password')
            }

            this.eventDispatcher.emit('userSignIn', userRecord)

            this.logger.silly('Issuing authorization code')
            const authCode = await this.issueAuthCode(userRecord, authRequest)
            this.eventDispatcher.emit('authCodeIssued', authCode)
            return authCode

        } catch (error) {
            this.logger.error('Error in Auth.SignIn microservice: %o', error)
            throw error
        }
    }

    public async ValidateAuthCode({ grant_type, code, state }: ITokenExchangeInput, clientId: string, userName?: IUserNameDTO): Promise<{ user: IUserDisplay, token: IAuthToken }> {
        try {
            if (grant_type !== "authorization_code") {
                throw new Error ('Invalid grant_type value')
            }

            const nonce = parseInt(code.substr(28, 37))
            if (code.length !== 37 || code.substr(0, 3) !== "HC-" || nonce < 10 ** 8 || nonce >= 10 ** 10) {
                throw new Error('Invalid authorization code format')
            }

            const key = `auth.grant:${code}`

            const authService = this.parentLayer.GetLowerLayer().GetService('auth') as MemoryServices.Auth
            const authGrant = await authService.GetAndDeleteByKey(key)

            if (authGrant.client_id !== clientId) {
                throw new Error('Client not authorized')
            }

            if (authGrant.state !== state) {
                throw new Error('Authorization grant state does not match original')
            }

            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            
            let userDisplay: IUserDisplay

            if (userName) {
                userDisplay = await userService.UpdatePersistently(authGrant.user_id, userName)
            } else {
                userDisplay = await userService.GetById(authGrant.user_id)
            }

            const authToken = await this.generateToken(userDisplay, authGrant)

            return { user: userDisplay, token: authToken }

        } catch (error) {
            this.logger.error('Error in Auth.ValidateAuthCode microservice: %o', error)
            throw error
        }
    }

    public async RefreshToken({ refresh_token }: IRefreshToken, clientId: string): Promise<{ user: IUserDisplay, token: IAuthToken }> {
        const code = refresh_token
        const key = `auth.grant:${code}`

        try {
            const nonce = parseInt(code.substr(28, 37))
            if (code.length !== 37 || code.substr(0, 3) !== "HC-" || nonce < 10 ** 8 || nonce >= 10 ** 10) {
                throw new Error('Invalid refresh_token format')
            }

            const authService = this.parentLayer.GetLowerLayer().GetService('auth') as MemoryServices.Auth
            const authGrant = await authService.GetAndDeleteByKey(key)

            if (authGrant.client_id !== clientId) {
                throw new Error('Client not authorized')
            }

            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userDisplay = await userService.GetById(authGrant.user_id)

            const authToken = await this.generateToken(userDisplay, authGrant)

            const sessionService = this.parentLayer.GetLowerLayer().GetService('session') as MemoryServices.Session
            const oldKey = `session:${authGrant.session}`
            const newKey = `session:${authToken.access_token}`

            await sessionService.RenameKeys(oldKey, newKey)

            return { user: userDisplay, token: authToken }
        } catch (error) {
            this.logger.error('Error in Auth.RefreshToken microservice: %o', error)
            throw error
        }
    }

    public async LogOut(token: string): Promise<void> {
        try {
            const key = `session:${token}`

            const sessionService = this.parentLayer.GetLowerLayer().GetService('session') as MemoryServices.Session
            await sessionService.DeleteByKey(key)

        } catch (error) {
            this.logger.error('Error in Auth.LogOut microservice: %o', error)
            throw error
        }
    }

    public async CloseAllSessions({ _id }: Partial<IUserRecord>): Promise<void> {
        try {
            const sessionService = this.parentLayer.GetLowerLayer().GetService('session') as MemoryServices.Session
            await sessionService.DeleteAllByUserId(_id)

        } catch (error) {
            this.logger.error('Error in Auth.CloseAllSessions microservice: %o', error)
            throw error
        }
    }

    public RecoverAccount({ email }: Partial<IUserInputDTO>): void {

    }

    public GetPwdResetter(resetToken: IResetToken): IUserNameDTO {

    }

    public ResetPassword(resetToken: IResetToken, {}: IResetUserPwd) {

    }

    private async generateToken(user: IUserDisplay, authRequest: IAuthRequest): Promise<IAuthToken> {
        try {
            this.logger.silly(`Sign JWT for userId: ${user._id}`)
            const access_token = this.jwt.sign(
                {
                    sub: user._id,
                    aud: authRequest.client_id,
                    exp: Math.floor((Date.now() / 1000)) + config.auth.accessTokenExp,
                    iat: Math.floor((Date.now() / 1000)),
                    name: user.firstName + ' ' + user.lastName,
                    picture: ''
                } as IAccessToken,
                config.jwtSecret
            )

            const sessionService = this.parentLayer.GetLowerLayer().GetService('session') as MemoryServices.Session
            const key = `session:${access_token}`
            const { refresh_token } = await this.issueRefreshToken(user, { ...authRequest, grant_type: "refresh_token" }, access_token)
            await sessionService.Create({ key, user: user._id, connection: false })
            
            return {
                access_token,
                token_type: 'bearer',
                expires_in: config.auth.accessTokenExp,
                refresh_token
            }
        } catch (error) {
            this.logger.error('Error in Auth.generateToken microservice: %o', error)
            throw error
        }
    }

    private async issueAuthCode(user: IUserDisplay, authRequest: IAuthRequest): Promise<IAuthorizationCode> {
        try {
            if (authRequest.grant_type !== "authorization_code") {
                throw new Error('"grant_type" value must be "authorization_code"')
            }

            const authorization_code = this.generateAuthCode()

            const authService = this.parentLayer.GetLowerLayer().GetService('auth') as MemoryServices.Auth
            await authService.Create(authorization_code, user, authRequest)
            
            return {
                authorization_code
            }

        } catch (error) {
            this.logger.error('Error in Auth.issueAuthCode microservice: %o', error)
            throw error
        }
    }

    private async issueRefreshToken(user: IUserDisplay, authRequest: IAuthRequest, jwtToken: string): Promise<IRefreshToken> {
        try {
            if (authRequest.grant_type !== "refresh_token") {
                throw new Error('"grant_type" value must be "refresh_token"')
            }

            const refresh_token = this.generateAuthCode()

            const authService = this.parentLayer.GetLowerLayer().GetService('auth') as MemoryServices.Auth
            await authService.Create(refresh_token, user, authRequest, jwtToken)
            
            return {
                refresh_token
            }

        } catch (error) {
            this.logger.error('Error in Auth.issueRefreshToken microservice: %o', error)
            throw error
        }
    }

    private generateAuthCode(): string {

        function generateNonce(): string {
            const value = `${(Math.random() * 10 ** 9).toFixed().toString()}`
                if(value.length !== 9) {
                    return generateNonce()
                } else return value
        }

        return `HC-${this.bson.createObjectId()}-${generateNonce()}`
    }
}