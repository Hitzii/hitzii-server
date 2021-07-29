import { EventEmitter } from "stream"
import { Inject, Service } from "typedi"
import { Logger } from "winston"
import ICron from "../interfaces/ICron"
import { MicroService } from "../interfaces/IMicroService"

@Service()
export default class Auth extends MicroService {
    constructor(
        @Inject('l3.eventHandler') eventDispatcher: EventEmitter,
        @Inject('l3.jobScheduler') jobScheduler: ICron,
        @Inject('logger') logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, logger)
    }

    public GetToken(): string {
        return 'Pocoyo!'
    }
}