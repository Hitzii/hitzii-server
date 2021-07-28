import { EventEmitter } from "events"
import { Logger } from "winston"
import ICron from "./ICron"

export class MicroService {
    protected eventDispatcher: EventEmitter
    protected jobScheduler: ICron
    protected logger: Logger

    constructor({ eventDispatcher, jobScheduler, logger }: { eventDispatcher: EventEmitter, jobScheduler: ICron, logger: Logger }) {
        this.eventDispatcher = eventDispatcher
        this.jobScheduler = jobScheduler
        this.logger = logger
    }
}