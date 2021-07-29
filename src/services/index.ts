import { EventEmitter } from "events";
import { Inject } from "typedi";
import { L3EventHandler } from "../decorators/eventHandler";
import { L3JobScheduler } from "../decorators/jobScheduler";
import Layer from "../decorators/layer";
import ICron from "../interfaces/ICron";
import { L3Provider } from "../interfaces/ILayer";
import { MicroService } from "../interfaces/IMicroService";

@Layer()
export default class Services extends L3Provider {
    @Inject('auth.microservices')
    private auth: MicroService

    constructor(
        @L3EventHandler() eventHandler: EventEmitter,
        @L3JobScheduler() jobScheduler: ICron
    ) {
        super(eventHandler, jobScheduler)
    }

    public GetService(serviceId: string): MicroService {
        if(this[serviceId] !== this.eventHandler || this[serviceId] !== this.jobScheduler) {
            return this[serviceId]
        } else {
            throw new Error('The service must be a MicroService')
        }
    }
}