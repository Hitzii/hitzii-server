import { Inject, Service } from "typedi";
import { Logger } from "winston";
import { L3JobScheduler } from "../../decorators/jobScheduler";
import DevLogger from "../../decorators/logger";
import ICron from "../../interfaces/dependencies/ICron";
import { IGoogleDiscoveryDoc } from "../../interfaces/IDiscoveryDoc";
import OpenIdProvider from "./openIdProvider";

@Service()
export default class GoogleProvider extends OpenIdProvider {
    providerName = "google" as "google"

    @Inject('googleDiscoveryDoc')
    discoveryDoc: IGoogleDiscoveryDoc

    constructor(
        @L3JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(jobScheduler, logger)
    }
}