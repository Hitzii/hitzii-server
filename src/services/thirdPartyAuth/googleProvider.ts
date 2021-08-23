import { Inject, Service } from "typedi";
import { Logger } from "winston";
import DevLogger from "../../decorators/logger";
import { IGoogleDiscoveryDoc } from "../../interfaces/IDiscoveryDoc";
import OpenIdProvider from "./openIdProvider";

@Service()
export default class GoogleProvider extends OpenIdProvider {
    providerName = "google" as "google"

    @Inject('googleDiscoveryDoc')
    discoveryDoc: IGoogleDiscoveryDoc

    constructor(
        @DevLogger() logger: Logger
    ) {
        super(logger)
    }
}