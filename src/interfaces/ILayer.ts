import EventEmitter from 'events'
import { Router } from 'express'
import { Server } from 'http'
import LoggerInstance from '../loaders/logger'
import ICron from './ICron'
import { MicroService } from './IMicroService'

export class L4Provider {
    protected l3Provider: L3Provider

    constructor(
        protected router: Router,
        protected httpServer: Server
    ) {}

    public GetRouter(): Router {
        return this.router
    }

    public GetHTTPServer(): Server {
        return this.httpServer
    }

    public SetLowerLayer(l3Provider: L3Provider) {
        this.l3Provider = l3Provider
    }
}

export class L3Provider {
    constructor(
        protected eventHandler: EventEmitter,
        protected jobScheduler: ICron
    ) {}

    public GetService(serviceId: string): MicroService {
        if (serviceId) {
            const eventDispatcher = this.eventHandler
            const jobScheduler = this.jobScheduler
            const logger = LoggerInstance
            return new MicroService(eventDispatcher, jobScheduler, logger)
        }
    }
}