import EventEmitter from "events";
import { Service } from "typedi";
import { Logger } from "winston";
import { L3EventHandler } from "../../decorators/eventHandler";
import { L3JobScheduler } from "../../decorators/jobScheduler";
import DevLogger from "../../decorators/logger";
import ICron from "../../interfaces/dependencies/ICron";
import { IAuthorizationURI, IRedirectURI } from "../../interfaces/IAuthToken";
import OpenIdProvider from "./openIdProvider";

@Service()
export default class GoogleProvider extends OpenIdProvider {
    constructor(
        @L3EventHandler() eventDispatcher: EventEmitter,
        @L3JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, logger)
    }

    public async SignUp({ redirect_uri }: IRedirectURI): Promise<IAuthorizationURI> {
        return {
            authorization_uri: 'nio'
        }
    }
}