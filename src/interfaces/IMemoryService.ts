import EventEmitter from "events"
import { Redis } from "ioredis"
import { Logger } from "winston"
import ICron from "./ICron"
import { L2Provider } from "./ILayer"

export class MemoryService {
    protected parentLayer: L2Provider

    constructor(
        protected eventDispatcher: EventEmitter,
        protected jobScheduler: ICron,
        protected redis: Redis,
        protected logger: Logger
    ) {
        this.eventDispatcher = eventDispatcher
        this.jobScheduler = jobScheduler
        this.redis = redis
        this.logger = logger
    }

    public SetParentLayer(l2Provider: L2Provider): void {
        this.parentLayer = l2Provider
    }
}