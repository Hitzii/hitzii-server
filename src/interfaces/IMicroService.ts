import { EventEmitter } from "events"
import { Logger } from "winston"
import ICron from "./ICron"
import { L3Provider } from "./ILayer"

export class MicroService {
    protected parentLayer: L3Provider

    constructor(
        protected eventDispatcher: EventEmitter,
        protected jobScheduler: ICron,
        protected logger: Logger
    ) {
        this.eventDispatcher = eventDispatcher
        this.jobScheduler = jobScheduler
        this.logger = logger
    }

    public SetParentLayer(l3Provider: L3Provider): void {
        this.parentLayer = l3Provider
    }
}