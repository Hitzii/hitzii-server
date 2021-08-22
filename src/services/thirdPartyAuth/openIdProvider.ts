import { AxiosInstance, AxiosRequestConfig } from "axios";
import { Inject, Service } from "typedi";
import { Logger } from "winston";
import config from "../../config";
import { L3JobScheduler } from "../../decorators/jobScheduler";
import DevLogger from "../../decorators/logger";
import IBSON from "../../interfaces/dependencies/IBSON";
import ICron from "../../interfaces/dependencies/ICron";
import IJWT from "../../interfaces/dependencies/IJWT";
import { IAuthorizationCode, IAuthorizationURI, IAuthRequest, IThirdAuthCallback, IThirdAuthCode, IThirdAuthToken, IThirdIDToken } from "../../interfaces/IAuthToken";
import { MicroService } from "../../interfaces/IMicroService";
import { IUserDisplay } from "../../interfaces/IUser";

@Service()
export default class OpenIdProvider extends MicroService {
    protected providerName: 'google' | 'facebook'
    protected discoveryDoc: any
    
    @Inject('axios')
    axios: AxiosInstance

    @Inject('bson')
    private bson: IBSON

    @Inject('jwt')
    private jwt: IJWT

    constructor(
        @L3JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(jobScheduler, logger)
    }

    public async SignUp(authRequest: IAuthRequest): Promise<IThirdAuthCode> {
        try {
            const { authorization_uri, authorization_code } = await this.getAuthURI(authRequest)

            const requestConfig: AxiosRequestConfig = {
                url: authorization_uri,
                method: 'get'
            }

            const { status } = await this.axios(requestConfig)
            this.logger.debug('Response status is %d', status)

            if (!(status === 200 || status === 201 || status === 302)) {
                throw new Error(`Authorization request failed with status code ${status}`)
            }

            return {
                authorization_code,
                providerName: this.providerName
            }
        } catch (error) {
            this.logger.error('Error in %sProvider.SignUp microservice: %o', this.providerName, error)
            throw error
        }
    }

    public async ExchangeAuthCode({ code, state, scope }: IThirdAuthCallback): Promise<void> {
        try {
            if (scope !== "openid email profile") {
                throw new Error('Wrong authorization scope')
            }

            const authorization_code = Buffer.from(state, 'base64url').toString('ascii')
            const key = `auth.grant:${authorization_code}`
            const authService = this.parentLayer.GetLowerLayer().GetService('auth') as MemoryServices.Auth
            const authGrant = await authService.GetByKey(key)

            if (!authGrant) {
                throw new Error('Invalid state. Rejecting authorization code')
            }

            const requestConfig: AxiosRequestConfig = {
                url: this.discoveryDoc.token_endpoint,
                method: 'post',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: 'code=' + code
                    + 'client_id=' + config[this.providerName].id
                    + 'client_secret=' + config[this.providerName].secret
                    + 'redirect_uri=' + config[this.providerName].redirect_uri
                    + 'grant_type=authorization_code'
            }

            const { data }: { data: IThirdAuthToken } = await this.axios(requestConfig)
            const idToken = this.jwt.decode(data.id_token, { json: true }) as IThirdIDToken

            if (authGrant.nonce !== idToken.nonce) {
                throw new Error('Nonce given by provider does not match client nonce')
            }

            const userService = this.parentLayer.GetService('user') as MicroServices.User
            await userService.CreateAccount({
                _id: authGrant.user_id,
                firstName: idToken.given_name,
                lastName: idToken.family_name,
                email: idToken.email,
                emailVerified: (idToken.email_verified === "true") ? true : false ,
                openID: {
                    provider: this.providerName,
                    email: idToken.email,
                    emailVerified: (idToken.email_verified === "true") ? true : false,
                    sub: idToken.sub
                },
                picture: idToken.picture
            })

        } catch (error) {
            this.logger.error('Error in %sProvider.GetAuthURI microservice: %o', this.providerName, error)
            throw error
        }
    }

    protected async getAuthURI(authRequest: IAuthRequest): Promise<IAuthorizationURI> {
        try {
            const userId = this.bson.createObjectId().toString()
            const { authorization_code } = await this.issueAuthCode({ _id: userId }, authRequest)

            const serverState = Buffer.from(authorization_code).toString('base64url')
            const authorization_uri = this.discoveryDoc.authorization_endpoint + '?'
                + 'response_type=code'
                + '&client_id=' + config[this.providerName].id
                + '&scope=' + config[this.providerName].default_scope
                + '&redirect_uri=' + config[this.providerName].redirect_uri
                + '&state=' + serverState
                + `${authRequest.login_hint ? `&login_hint=${authRequest.login_hint}` : ''}`
                + '&nonce=' + authRequest.nonce

            this.logger.debug('new authorization_uri is %s', authorization_uri)

            return {
                authorization_uri,
                authorization_code
            }
        } catch (error) {
            this.logger.error('Error in %sProvider.GetAuthURI microservice: %o', this.providerName, error)
            throw error
        }
    }

    protected async issueAuthCode(user: Partial<IUserDisplay>, authRequest: IAuthRequest): Promise<IAuthorizationCode> {
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

    protected generateAuthCode(): string {

        function generateNonce(): string {
            const value = `${(Math.random() * 10 ** 9).toFixed().toString()}`
                if(value.length !== 9) {
                    return generateNonce()
                } else return value
        }

        return `HC-${this.bson.createObjectId()}-${generateNonce()}`
    }
}