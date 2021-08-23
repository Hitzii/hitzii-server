import { Inject } from "typedi";
import Layer from "../decorators/layer";
import { DataService } from "../interfaces/IDataService";
import { L1Provider } from "../interfaces/ILayer";

@Layer()
export default class PersistentData extends L1Provider {
    @Inject('user.dataservice')
    private user: DataService

    public GetService(serviceId: string): DataService {
        const serviceInstance = this[serviceId] as DataService

        if(Object.getPrototypeOf(serviceInstance.constructor) === DataService) {
            serviceInstance.SetParentLayer(this)
            return serviceInstance
        } else {
            throw new Error('The service must be a MicroService')
        }
    }
}