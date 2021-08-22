import { Inject } from "typedi";
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

    @Inject('recovery.memoryservice')
    private recovery: MemoryService

    @Inject('emailVerification.memoryservice')
    private emailVerification: MemoryService

    constructor(
        @L2JobScheduler() jobScheduler: ICron
    ) {
        super(jobScheduler)
    }

    public GetService(serviceId: string): MemoryService {
        const serviceInstance = this[serviceId] as MemoryService | any

        if(serviceInstance !== this.jobScheduler) {
            serviceInstance.SetParentLayer(this)
            return serviceInstance
        } else {
            throw new Error('The service must be a MemoryService')
        }
    }
}