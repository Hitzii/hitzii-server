import { EventEmitter } from "events";
import { Inject, Service } from "typedi";
import ICron from "../interfaces/ICron";
import { L3Provider } from "../interfaces/ILayer";
import LoggerInstance from "../loaders/logger";
import Auth from "./auth";

@Service()
export default class Services extends L3Provider {
    constructor(
        @Inject('eventHandler') eventHandler: EventEmitter,
        @Inject('jobScheduler') jobScheduler: ICron
    ) {
        super(eventHandler, jobScheduler)
    }

    public GetService(serviceId: string) {
        const eventDispatcher = this.eventHandler
        const jobScheduler = this.jobScheduler

        switch (serviceId) {
            case 'auth-microservice':
                return new Auth({ eventDispatcher, jobScheduler, logger: LoggerInstance })
        
            default:
                break;
        }
    }
}