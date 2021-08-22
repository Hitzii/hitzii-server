import { Inject, Service } from "typedi";
import { Logger } from "winston";
import { L3JobScheduler } from "../../decorators/jobScheduler";
import DevLogger from "../../decorators/logger";
import ICron from "../../interfaces/dependencies/ICron";
import { IFacebookDiscoveryDoc } from "../../interfaces/IDiscoveryDoc";
import OpenIdProvider from "./openIdProvider";

@Service()
export default class FacebookProvider extends OpenIdProvider {
    providerName = "facebook" as "facebook"

    @Inject('facebookDiscoveryDoc')
    discoveryDoc: IFacebookDiscoveryDoc

    constructor(
        @L3JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(jobScheduler, logger)
    }
}