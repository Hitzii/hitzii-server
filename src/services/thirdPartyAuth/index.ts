import { Inject, Service } from "typedi"
import { Logger } from "winston"
import DevLogger from "../../decorators/logger"
import { IAuthRequest, IThirdAuthCallback, IThirdAuthCode } from "../../interfaces/IAuthToken"
import { MicroService } from "../../interfaces/IMicroService"
import OpenIdProvider from "./openIdProvider"

@Service()
export default class ThirdPartyAuth extends MicroService {
    @Inject('googleProvider.microservice')
    private googleProvider: OpenIdProvider

    @Inject('facebookProvider.microservice')
    private facebookProvider: OpenIdProvider

    constructor(
        @DevLogger() logger: Logger
    ) {
        super(logger)
    }
    
    public async SignUp(authRequest: IAuthRequest): Promise<IThirdAuthCode> {
        try {
            switch (authRequest.provider) {
                case 'google':
                    this.googleProvider.SetParentLayer(this.parentLayer)
                    return this.googleProvider.SignUp(authRequest)
            
                case 'facebook':
                    this.facebookProvider.SetParentLayer(this.parentLayer)
                    return this.facebookProvider.SignUp(authRequest)
            
                default:
                    throw new Error('No provider name specified')
            }
        } catch (error) {
            this.logger.error('Error in ThirdPartyAuth.SignUp microservice: %o', error)
            throw error
        }
    }

    public async ExchangeAuthCode(providerName: string, thirdAuthCallback: IThirdAuthCallback): Promise<void> {
        try {
            switch (providerName) {
                case 'google':
                    this.googleProvider.SetParentLayer(this.parentLayer)
                    return this.googleProvider.ExchangeAuthCode(thirdAuthCallback)
            
                case 'facebook':
                    this.facebookProvider.SetParentLayer(this.parentLayer)
                    return this.facebookProvider.ExchangeAuthCode(thirdAuthCallback)
            
                default:
                    throw new Error('No provider name specified')
            }
        } catch (error) {
            this.logger.error('Error in ThirdPartyAuth.SignUp microservice: %o', error)
            throw error
        }
    }
}