import EventEmitter from "events";
import { Inject } from "typedi";
import { L1EventHandler } from "../decorators/eventHandler";
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
        @L1EventHandler() eventHandler: EventEmitter,
        @L1JobScheduler() jobScheduler: ICron
    ) {
        super(eventHandler, jobScheduler)
    }

    public GetService(serviceId: string): DataService {
        const serviceInstance = this[serviceId] as DataService | any

        if(serviceInstance !== this.eventHandler || serviceInstance !== this.jobScheduler) {
            serviceInstance.SetParentLayer(this)
            return serviceInstance
        } else {
            throw new Error('The service must be a MicroService')
        }
    }
}