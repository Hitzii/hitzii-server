import EventEmitter from "events";
import { Inject } from "typedi";
import { L2EventHandler } from "../decorators/eventHandler";
import { L2JobScheduler } from "../decorators/jobScheduler";
import Layer from "../decorators/layer";
import ICron from "../interfaces/dependencies/ICron";
import { L2Provider } from "../interfaces/ILayer";
import { MemoryService } from "../interfaces/IMemoryService";

@Layer()
export default class Memory extends L2Provider {
    @Inject('auth.memoryservice')
    private auth: MemoryService

    @Inject('user.memoryservice')
    private user: MemoryService

    @Inject('session.memoryservice')
    private session: MemoryService

    constructor(
        @L2EventHandler() eventHandler: EventEmitter,
        @L2JobScheduler() jobScheduler: ICron
    ) {
        super(eventHandler, jobScheduler)
    }

    public GetService(serviceId: string): MemoryService {
        const serviceInstance = this[serviceId] as MemoryService | any

        if(serviceInstance !== this.eventHandler || serviceInstance !== this.jobScheduler) {
            serviceInstance.SetParentLayer(this)
            return serviceInstance
        } else {
            throw new Error('The service must be a MemoryService')
        }
    }
}