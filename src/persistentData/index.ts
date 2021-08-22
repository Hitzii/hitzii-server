import { Inject } from "typedi";
import { L1JobScheduler } from "../decorators/jobScheduler";
import Layer from "../decorators/layer";
import ICron from "../interfaces/dependencies/ICron";
import { DataService } from "../interfaces/IDataService";
import { L1Provider } from "../interfaces/ILayer";

@Layer()
export default class PersistentData extends L1Provider {
    @Inject('user.dataservice')
    private user: DataService

    constructor(
        @L1JobScheduler() jobScheduler: ICron
    ) {
        super(jobScheduler)
    }

    public GetService(serviceId: string): DataService {
        const serviceInstance = this[serviceId] as DataService | any

        if(serviceInstance !== this.jobScheduler) {
            serviceInstance.SetParentLayer(this)
            return serviceInstance
        } else {
            throw new Error('The service must be a MicroService')
        }
    }
}