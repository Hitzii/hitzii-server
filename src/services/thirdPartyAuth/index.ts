import { EventEmitter } from "stream"
import { Service } from "typedi"
import { Logger } from "winston"
import { L3EventHandler } from "../../decorators/eventHandler"
import { L3JobScheduler } from "../../decorators/jobScheduler"
import DevLogger from "../../decorators/logger"
import { IAuthorizationCode, IAuthorizationURI, IRedirectURI, IThirdAuthCode } from "../../interfaces/IAuthToken"
import ICron from "../../interfaces/dependencies/ICron"
import { MicroService } from "../../interfaces/IMicroService"
import { IAccountName, IUserInputDTO } from "../../interfaces/IUser"

@Service()
export default class ThirdPartyAuth extends MicroService {
    constructor(
        @L3EventHandler() eventDispatcher: EventEmitter,
        @L3JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, logger)
    }
    
    public SignUp({ redirect_uri, providerName }: IRedirectURI): IAuthorizationURI {
        if (redirect_uri && providerName) {
            return {
                authorization_uri: 'https://server.example.com/auth'
            }
        }
    }

    public ExchangeAuthToken({ authorization_code, providerName }: IThirdAuthCode): { accountName: IAccountName, code: IAuthorizationCode } {
        if (authorization_code && providerName) {
            return {
                accountName: { displayName: 'Pollito' },
                code: { authorization_code: 'mamaaaa' }
            }
        }
    }
}