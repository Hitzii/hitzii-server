import { EventEmitter } from "events"
import { Inject, Service } from "typedi"
import { Logger } from "winston"
import { L3EventHandler } from "../decorators/eventHandler"
import { L3JobScheduler } from "../decorators/jobScheduler"
import DevLogger from "../decorators/logger"
import { IAccessToken, IAuthorizationCode, IAuthRequest, IAuthToken, IEmailVerificationCode, IEmailVerificationGrant, IEmailVerificationRequest, IRecoveryCode, IRecoveryGrant, IRecoveryRequest, IRefreshToken, ITokenExchangeInput } from "../interfaces/IAuthToken"
import ICron from "../interfaces/dependencies/ICron"
import { MicroService } from "../interfaces/IMicroService"
import { IResetUserPwd, IUserAuthPayload, IUserDisplay, IUserInputDTO, IUserRecord } from "../interfaces/IUser"
import Memory from "../memory"
import config from "../config"
import IBSON from "../interfaces/dependencies/IBSON"
import IArgon2 from "../interfaces/dependencies/IArgon2"
import ICrypto from "../interfaces/dependencies/ICrypto"
import IJWT from "../interfaces/dependencies/IJWT"
import { Transporter, SendMailOptions, SentMessageInfo } from 'nodemailer'
import { IMissingItems } from "../interfaces/IUtils"

interface ExtSentMessageInfo extends SentMessageInfo {
    messageId: string
}

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

    @Inject('mailer')
    private mailer: Transporter

    constructor(
        @L3EventHandler() eventDispatcher: EventEmitter,
        @L3JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, logger)
    }

    // User authorization
    
    public async SignUp(userInput: IUserInputDTO, authRequest: IAuthRequest): Promise<IAuthorizationCode> {
        try {
            const salt = this.crypto.randomBytes(32) as Buffer

            this.logger.silly('Hashing password')
            const hashedPassword = await this.argon2.hash(userInput.password, { salt })
            
            this.logger.silly('Creating user DB record')
            const userService = this.parentLayer.GetService('user') as MicroServices.User
            const userId = this.bson.createObjectId().toString()
            const { user, warning } = await userService.CreateAccount({
                ...userInput,
                _id: userId,
                hashedPassword,
                salt: salt.toString('hex'),
                emailVerified: false
            })

            if (!user) {
                throw new Error('User cannot be created')
            }

            if (warning.missing_items.includes('email uniqueness')) {
                await userService.DeleteAccountHardly(userId)
                throw new Error('This email is already in use')
            }

            this.eventDispatcher.emit('userSignUp', user)

            this.logger.silly('Issuing authorization code')
            // return this.issueAuthCode(userRecord, authRequest)
            const authCode = await this.issueAuthCode(user, authRequest)
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
            this.logger.debug('The userRecord was %o', userRecord)

            if (!userRecord) {
                throw new Error('User no registered')
            }

            this.logger.silly('Validating password')
            if (!userRecord.hashedPassword) {
                throw new Error('User has no password')
            }
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

    public async ValidateAuthCode({ grant_type, code, state, redirect_uri }: ITokenExchangeInput, clientId: string): Promise<IUserAuthPayload> {
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

            if (authGrant.redirect_uri !== redirect_uri) {
                throw new Error('Authorization grant redirect_uri does not match original')
            }

            const userService = this.parentLayer.GetService('user') as MicroServices.User
            const { user, warning } = await userService.GetUserValidation(authGrant.user_id)

            const authToken = await this.generateToken(user, authGrant)

            if (warning) return { user, token: authToken, warning }

            return { user, token: authToken }

        } catch (error) {
            this.logger.error('Error in Auth.ValidateAuthCode microservice: %o', error)
            throw error
        }
    }

    // Token refreshing

    public async RefreshToken({ refresh_token }: IRefreshToken, clientId: string): Promise<IUserAuthPayload> {
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

            const userService = this.parentLayer.GetService('user') as MicroServices.User
            const { user, warning } = await userService.GetUserValidation(authGrant.user_id)

            const authToken = await this.generateToken(user, authGrant)

            if (warning) return { user, token: authToken, warning }

            return { user, token: authToken }
        } catch (error) {
            this.logger.error('Error in Auth.RefreshToken microservice: %o', error)
            throw error
        }
    }

    // Logging out and revoking access tokens

    public LogOut({ _id }: Partial<IUserRecord>): void {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            userService.DeleteInMemoryById(_id)

        } catch (error) {
            this.logger.error('Error in Auth.LogOut microservice: %o', error)
            throw error
        }
    }

    // public CloseAllSessions({ _id }: Partial<IUserRecord>): void {
    //     try {
    //         const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
    //         userService.DeleteInMemoryById(_id)

    //     } catch (error) {
    //         this.logger.error('Error in Auth.LogOut microservice: %o', error)
    //         throw error
    //     }
    // }

    // Account recovery

    public async RecoverAccount({ email }: Partial<IUserInputDTO>, recoveryRequest: IRecoveryRequest): Promise<void> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userRecord = await userService.GetRecordByField('email', email)

            if (userRecord) {
                const { recoveryCode, recoveryGrant } = await this.issueRecoveryCode(userRecord, recoveryRequest)
                const recoveryURI = await this.getRecoveryURI(recoveryCode, recoveryGrant)
                this.sendRecoveryEmail(email, recoveryURI)
            }
        } catch (error) {
            this.logger.error('Error in Auth.RecoverAccount microservice: %o', error)
            throw error
        }
    }

    public async GetPwdResetter({ recovery_code }: IRecoveryCode, recoveryRequest: IRecoveryRequest): Promise<IUserDisplay> {
        try {
            const { client_id, state, redirect_uri } = recoveryRequest
            const decodedValue = this.decodeBase64UrlToASCIIThrice(recovery_code)
            const key = `recovery.grant:${decodedValue}`

            const recoveryService = this.parentLayer.GetLowerLayer().GetService('recovery') as MemoryServices.Recovery
            const recoveryGrant = await recoveryService.GetByKey(key)

            if (recoveryGrant.client_id !== client_id) {
                throw new Error('Client not authorized')
            }

            if (recoveryGrant.state !== state) {
                throw new Error('Recovery grant state does not match original')
            }

            if (recoveryGrant.redirect_uri !== redirect_uri) {
                throw new Error('Recovery grant redirect_uri does not match original')
            }

            const userService = this.parentLayer.GetService('user') as MicroServices.User
            return userService.GetDisplayData(recoveryGrant.user_id)

        } catch (error) {
            this.logger.error('Error in Auth.GetPwdResetter microservice: %o', error)
            throw error
        }
    }

    public async ResetPassword({ recovery_code }: IRecoveryCode, recoveryRequest: IRecoveryRequest, { new_password }: IResetUserPwd): Promise<boolean> {
        try {
            const { client_id, state, redirect_uri } = recoveryRequest
            const decodedValue = this.decodeBase64UrlToASCIIThrice(recovery_code)
            const key = `recovery.grant:${decodedValue}`

            const recoveryService = this.parentLayer.GetLowerLayer().GetService('recovery') as MemoryServices.Recovery
            const recoveryGrant = await recoveryService.GetAndDeleteByKey(key)

            if (recoveryGrant.client_id !== client_id) {
                throw new Error('Client not authorized')
            }

            if (recoveryGrant.state !== state) {
                throw new Error('Recovery grant state does not match original')
            }

            if (recoveryGrant.redirect_uri !== redirect_uri) {
                throw new Error('Recovery grant redirect_uri does not match original')
            }

            const salt = this.crypto.randomBytes(32) as Buffer
            const hashedPassword = await this.argon2.hash(new_password, { salt })

            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userRecord = await userService.UpdatePersistently(recoveryGrant.user_id, {
                hashedPassword,
                salt: salt.toString('hex')
            })

            if (!userRecord) {
                this.logger.error('Could not reset user password')
                return false
            }

            return true

        } catch (error) {
            this.logger.error('Error in Auth.ResetPassword microservice: %o', error)
            throw error
        }
    }

    // Email verification

    public async GetEmailVerification({ email }: Partial<IUserInputDTO>, emailVerificationRequest: IEmailVerificationRequest): Promise<void> {
        try {
            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userRecord = await userService.GetRecordByField('email', email)

            if (!userRecord) {
                throw new Error('No user matches the provided email.')
            }

            if (userRecord.emailVerified) {
                throw new Error('Email was already verified')
            }

            const { emailVerificationCode, emailVerificationGrant } = await this.issueEmailVerificationCode(userRecord, emailVerificationRequest)
            const emailVerificationURI = await this.getEmailVerificationURI(emailVerificationCode, emailVerificationGrant)
            await this.sendEmailVerification(email, emailVerificationURI)

        } catch (error) {
            this.logger.error('Error in Auth.GetEmailVerification microservice: %o', error)
            throw error
        }
    }

    public async VerifyEmail({ email_verification_code }: IEmailVerificationCode, emailVerificationRequest: IEmailVerificationRequest): Promise<boolean> {
        try {
            const { client_id, state, redirect_uri } = emailVerificationRequest
            const decodedValue = this.decodeBase64UrlToASCIIThrice(email_verification_code)
            const key = `emailVerification.grant:${decodedValue}`

            const emailVerificationService = this.parentLayer.GetLowerLayer().GetService('emailVerification') as MemoryServices.EmailVerification
            const emailVerificationGrant = await emailVerificationService.GetAndDeleteByKey(key)
            const { user_id } = emailVerificationGrant

            if (emailVerificationGrant.client_id !== client_id) {
                throw new Error('Client not authorized')
            }

            if (emailVerificationGrant.state !== state) {
                throw new Error('Email verification grant state does not match original')
            }

            if (emailVerificationGrant.redirect_uri !== redirect_uri) {
                throw new Error('Email verification grant redirect_uri does not match original')
            }

            const userService = this.parentLayer.GetLowerLayer().GetService('user') as MemoryServices.User
            const userRecord = await userService.UpdatePersistently(
                user_id,
                { emailVerified: true }
            )

            if (!userRecord) {
                this.logger.error('Could not verify user email')
                return false
            }

            const itemsLeft = await userService.DeleteMissingItemsAndGetItemsLeft(user_id, ['email verification'])
            if (itemsLeft.length > 0) {
                const message = this.writeWarningMessage(itemsLeft)
                await userService.AddValidationWarning(
                    user_id,
                    { message, missing_items: itemsLeft }
                )
            } else {
                await userService.DeleteWarningMessage(user_id)
            }

            return true

        } catch (error) {
            this.logger.error('Error in Auth.VerifyEmail microservice: %o', error)
            throw error
        }
    }

    /* Private methods */

    // User authorization

    private async generateToken(user: IUserDisplay, authRequest: IAuthRequest): Promise<IAuthToken> {
        try {
            this.logger.silly(`Sign JWT for userId: ${user._id}`)
            const access_token = this.jwt.sign(
                {
                    iss: 'https://api.hitzii.com/v1',
                    sub: user._id,
                    aud: authRequest.client_id,
                    exp: Math.floor((Date.now() / 1000)) + config.auth.accessTokenExp,
                    iat: Math.floor((Date.now() / 1000)),
                    name: user.firstName + ' ' + user.lastName,
                    picture: '',
                    given_name: user.firstName,
                    family_name: user.lastName,
                    email: user.email,
                    nonce: authRequest.nonce
                } as IAccessToken,
                config.jwtSecret
            )

            const { refresh_token } = await this.issueRefreshToken(user, { ...authRequest, grant_type: "refresh_token" })
            
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

    private async issueAuthCode(user: Partial<IUserDisplay>, authRequest: IAuthRequest): Promise<IAuthorizationCode> {
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

    // Token refreshing

    private async issueRefreshToken(user: IUserDisplay, authRequest: IAuthRequest): Promise<IRefreshToken> {
        try {
            if (authRequest.grant_type !== "refresh_token") {
                throw new Error('"grant_type" value must be "refresh_token"')
            }

            const refresh_token = this.generateAuthCode()

            const authService = this.parentLayer.GetLowerLayer().GetService('auth') as MemoryServices.Auth
            await authService.Create(refresh_token, user, authRequest)
            
            return {
                refresh_token
            }

        } catch (error) {
            this.logger.error('Error in Auth.issueRefreshToken microservice: %o', error)
            throw error
        }
    }

    // Account recovery

    private async issueRecoveryCode(user: Partial<IUserDisplay>, recoveryRequest: IRecoveryRequest): Promise<{ recoveryCode: IRecoveryCode, recoveryGrant: IRecoveryGrant }> {
        try {
            const recovery_code = this.generateAuthCode()

            const recoveryService = this.parentLayer.GetLowerLayer().GetService('recovery') as MemoryServices.Recovery
            const recoveryGrant = await recoveryService.Create(recovery_code, user, recoveryRequest)
            
            return {
                recoveryCode: { recovery_code },
                recoveryGrant
            }

        } catch (error) {
            this.logger.error('Error in Auth.issueRecoveryCode microservice: %o', error)
            throw error
        }
    }

    private async getRecoveryURI({ recovery_code }: IRecoveryCode, { redirect_uri }: IRecoveryGrant): Promise<string> {
        try {
            const encodedString = this.encodeASCIIToBase64UrlThrice(recovery_code)
            return `${redirect_uri}?code=${encodedString}&recover_account=true`
        } catch (error) {
            this.logger.error('Error in Auth.getRecoveryURI microservice: %o', error)
            throw error
        }
    }

    private async sendRecoveryEmail(to: string, recoveryURI: string): Promise<void> {
        try {
            const mail: SendMailOptions = {
                from: config.SMTP.mailFrom,
                to,
                subject: 'Recover your Hitzii account',
                text: `Hey, this is your single-use recovery link: ${recoveryURI}\nHere, you will set your new password. If you did not request an account recovery, ignore this email.`
            }

            const mailSent: ExtSentMessageInfo = await this.mailer.sendMail(mail)
            this.logger.info('Mail sent ID is: %s', mailSent.messageId)

        } catch (error) {
            this.logger.error('Error in Auth.sendRecoveryEmail microservice: %o', error)
            throw error
        }
    }

    // Email verification

    private async issueEmailVerificationCode(user: Partial<IUserDisplay>, emailVerificationRequest: IEmailVerificationRequest): Promise<{ emailVerificationCode: IEmailVerificationCode, emailVerificationGrant: IEmailVerificationGrant }> {
        try {
            const email_verification_code = this.generateAuthCode()

            const emailVerificationService = this.parentLayer.GetLowerLayer().GetService('emailVerification') as MemoryServices.EmailVerification
            const emailVerificationGrant = await emailVerificationService.Create(email_verification_code, user, emailVerificationRequest)
            
            return {
                emailVerificationCode: { email_verification_code },
                emailVerificationGrant
            }

        } catch (error) {
            this.logger.error('Error in Auth.issueEmailVerificationCode microservice: %o', error)
            throw error
        }
    }

    private async getEmailVerificationURI({ email_verification_code }: IEmailVerificationCode, { redirect_uri }: IEmailVerificationGrant): Promise<string> {
        try {
            const encodedString = this.encodeASCIIToBase64UrlThrice(email_verification_code)
            return `${redirect_uri}?code=${encodedString}&email_verification=true`
        } catch (error) {
            this.logger.error('Error in Auth.getEmailVerificationURI microservice: %o', error)
            throw error
        }
    }

    private async sendEmailVerification(to: string, emailVerificationURI: string): Promise<void> {
        try {
            const mail: SendMailOptions = {
                from: config.SMTP.mailFrom,
                to,
                subject: 'Verify your email with Hitzii',
                text: `Hey, this is your single-use email verification link: ${emailVerificationURI}\nHere, you will verify your primary email. If you did not request an email verification, ignore this email.`
            }

            const mailSent: ExtSentMessageInfo = await this.mailer.sendMail(mail)
            this.logger.info('Mail sent ID is: %s', mailSent.messageId)

        } catch (error) {
            this.logger.error('Error in Auth.sendEmailVerification microservice: %o', error)
            throw error
        }
    }

    // Common utils

    private generateAuthCode(): string {

        function generateNonce(): string {
            const value = `${(Math.random() * 10 ** 9).toFixed().toString()}`
                if(value.length !== 9) {
                    return generateNonce()
                } else return value
        }

        return `HC-${this.bson.createObjectId()}-${generateNonce()}`
    }

    private encodeASCIIToBase64UrlThrice(value: string): string {
        let encodedOnce = encodeURIComponent(Buffer.from(value).toString('base64'))
        let encodedTwice = encodeURIComponent(Buffer.from(encodedOnce).toString('base64'))

        return encodeURIComponent(Buffer.from(encodedTwice).toString('base64'))
    }

    private decodeBase64UrlToASCIIThrice(value: string): string {
        let decodedOnce = Buffer.from(decodeURIComponent(value), 'base64').toString('ascii')
        let decodedTwice = Buffer.from(decodeURIComponent(decodedOnce), 'base64').toString('ascii')

        return Buffer.from(decodeURIComponent(decodedTwice), 'base64').toString('ascii')
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