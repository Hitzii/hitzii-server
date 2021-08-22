import { Inject } from "typedi";
import { L3JobScheduler } from "../decorators/jobScheduler";
import Layer from "../decorators/layer";
import ICron from "../interfaces/dependencies/ICron";
import { L3Provider } from "../interfaces/ILayer";
import { MicroService } from "../interfaces/IMicroService";

@Layer()
export default class Services extends L3Provider {
    @Inject('auth.microservice')
    private auth: MicroService

    @Inject('thirdPartyAuth.microservice')
    private thirdPartyAuth: MicroService

    @Inject('user.microservice')
    private user: MicroService

    constructor(
        @L3JobScheduler() jobScheduler: ICron
    ) {
        super(jobScheduler)
    }

    public GetService(serviceId: string): MicroService {
        const serviceInstance = this[serviceId] as MicroService | any

        if(serviceInstance !== this.jobScheduler) {
            serviceInstance.SetParentLayer(this)
            return serviceInstance
        } else {
            throw new Error('The service must be a MicroService')
        }
    }
}