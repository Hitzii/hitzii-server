import { Logger } from "winston"
import ICron from "./dependencies/ICron"
import { L3Provider } from "./ILayer"
import { Subscriber } from "./ISubscriber"

export class MicroService {
    protected parentLayer: L3Provider
    protected eventDispatcher: Subscriber

    constructor(
        protected jobScheduler: ICron,
        protected logger: Logger
    ) {
        this.jobScheduler = jobScheduler
        this.logger = logger
    }

    public SetParentLayer(l3Provider: L3Provider): void {
        this.parentLayer = l3Provider
        this.setEventDispatcher(l3Provider.GetEventSubscriber())
    }

    private setEventDispatcher(dispatcher: Subscriber): void {
        this.eventDispatcher = dispatcher
    }
}