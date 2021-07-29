import { EventEmitter } from "stream"
import { Service } from "typedi"
import { Logger } from "winston"
import { L3EventHandler } from "../decorators/eventHandler"
import { L3JobScheduler } from "../decorators/jobScheduler"
import DevLogger from "../decorators/logger"
import ICron from "../interfaces/ICron"
import { MicroService } from "../interfaces/IMicroService"

@Service()
export default class Auth extends MicroService {
    constructor(
        @L3EventHandler() eventDispatcher: EventEmitter,
        @L3JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, logger)
    }

    public GetToken(): string {
        this.logger.silly('Pocoyo!')
        return 'Pocoyo!'
    }
}