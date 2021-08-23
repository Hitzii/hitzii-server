import { Inject } from "typedi";
import Layer from "../decorators/layer";
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

    public GetService(serviceId: string): MicroService {
        const serviceInstance = this[serviceId] as MicroService

        if(Object.getPrototypeOf(serviceInstance.constructor) === MicroService) {
            serviceInstance.SetParentLayer(this)
            return serviceInstance
        } else {
            throw new Error('The service must be a MicroService')
        }
    }
}