import EventEmitter from "events";
import { Logger } from "winston";
import ICron from "../../interfaces/dependencies/ICron";
import { IAuthorizationURI, IRedirectURI } from "../../interfaces/IAuthToken";
import { MicroService } from "../../interfaces/IMicroService";

export default class OpenIdProvider extends MicroService {
    protected providerName: string

    constructor(
        eventDispatcher: EventEmitter,
        jobScheduler: ICron,
        logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, logger)
    }

    public async SignUp({ redirect_uri }: IRedirectURI): Promise<IAuthorizationURI> {
        return {
            authorization_uri: 'https://www.hitzii.com'
        }
    }
}