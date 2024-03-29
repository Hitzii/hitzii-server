import { Logger } from "winston"
import { IJobScheduler } from "./IJobScheduler"
import { L3Provider } from "./ILayer"
import { ISubscriber } from "./ISubscriber"

export class MicroService {
    protected parentLayer: L3Provider
    protected eventDispatcher: ISubscriber
    protected jobScheduler: IJobScheduler

    constructor(
        protected logger: Logger
    ) {
        this.logger = logger
    }

    public SetParentLayer(l3Provider: L3Provider): void {
        this.parentLayer = l3Provider
        this.setEventDispatcher(l3Provider.GetEventSubscriber())
        this.setJobScheduler(l3Provider.GetJobScheduler())
    }

    private setEventDispatcher(dispatcher: ISubscriber): void {
        this.eventDispatcher = dispatcher
    }

    private setJobScheduler(jobScheduler: IJobScheduler): void {
        this.jobScheduler = jobScheduler
    }
}