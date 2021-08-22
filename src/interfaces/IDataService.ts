import { Document, Model } from "mongoose"
import { Logger } from "winston"
import ICron from "./dependencies/ICron"
import { L1Provider } from "./ILayer"
import { ISubscriber } from "./ISubscriber"

export class DataService {
    protected parentLayer: L1Provider
    protected eventDispatcher: ISubscriber
    protected model: Model<Document>

    constructor(
        protected jobScheduler: ICron,
        protected logger: Logger
    ) {
        this.jobScheduler = jobScheduler
        this.logger = logger
    }

    public SetParentLayer(l1Provider: L1Provider): void {
        this.parentLayer = l1Provider
        this.setEventDispatcher(l1Provider.GetEventSubscriber())
    }

    private setEventDispatcher(dispatcher: ISubscriber): void {
        this.eventDispatcher = dispatcher
    }
}