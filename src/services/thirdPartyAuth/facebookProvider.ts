import { Inject, Service } from "typedi";
import { Logger } from "winston";
import DevLogger from "../../decorators/logger";
import { IFacebookDiscoveryDoc } from "../../interfaces/IDiscoveryDoc";
import OpenIdProvider from "./openIdProvider";

@Service()
export default class FacebookProvider extends OpenIdProvider {
    providerName = "facebook" as "facebook"

    @Inject('facebookDiscoveryDoc')
    discoveryDoc: IFacebookDiscoveryDoc

    constructor(
        @DevLogger() logger: Logger
    ) {
        super(logger)
    }
}