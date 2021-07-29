import { EventEmitter } from "events";
import Container, { ContainerInstance, Inject, InjectMany, Service } from "typedi";
import Layer from "../decorators/layer";
import ICron from "../interfaces/ICron";
import { L3Provider } from "../interfaces/ILayer";
import { MicroService } from "../interfaces/IMicroService";
import LoggerInstance from "../loaders/logger";
import Auth from "./auth";

@Layer()
export default class Services extends L3Provider {
    @Inject('auth.microservices')
    private auth: MicroService

    constructor(
        @Inject('l3.eventHandler') eventHandler: EventEmitter,
        @Inject('l3.jobScheduler') jobScheduler: ICron
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