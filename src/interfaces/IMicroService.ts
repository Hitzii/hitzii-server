import { EventEmitter } from "events"
import { Logger } from "winston"
import ICron from "./ICron"

export class MicroService {

    constructor(
        protected eventDispatcher: EventEmitter,
        protected jobScheduler: ICron,
        protected logger: Logger
    ) {
        this.eventDispatcher = eventDispatcher
        this.jobScheduler = jobScheduler
        this.logger = logger
    }
}