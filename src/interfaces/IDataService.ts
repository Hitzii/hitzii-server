import { Document, Model } from "mongoose"
import { Logger } from "winston"
import { IJobScheduler } from "./IJobScheduler"
import { L1Provider } from "./ILayer"
import { ISubscriber } from "./ISubscriber"

export class DataService {
    protected parentLayer: L1Provider
    protected eventDispatcher: ISubscriber
    protected jobScheduler: IJobScheduler
    protected model: Model<Document>

    constructor(
        protected logger: Logger
    ) {
        this.logger = logger
    }

    public SetParentLayer(l1Provider: L1Provider): void {
        this.parentLayer = l1Provider
        this.setEventDispatcher(l1Provider.GetEventSubscriber())
        this.setJobScheduler(l1Provider.GetJobScheduler())
    }

    private setEventDispatcher(dispatcher: ISubscriber): void {
        this.eventDispatcher = dispatcher
    }

    private setJobScheduler(jobScheduler: IJobScheduler): void {
        this.jobScheduler = jobScheduler
    }
}