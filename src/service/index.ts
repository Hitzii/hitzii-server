import { EventEmitter } from "events";
import ICron from "../interfaces/ICron";
import { L3Provider } from "../interfaces/ILayer";
import LoggerInstance from "../loaders/logger";
import Auth from "./auth";

export default class Services extends L3Provider {
    constructor({ eventHandler, jobScheduler }: { eventHandler: EventEmitter, jobScheduler: ICron }) {
        super({ eventHandler, jobScheduler })
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