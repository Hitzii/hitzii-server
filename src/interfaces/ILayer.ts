import EventEmitter from 'events'
import { Router } from 'express'
import { Server } from 'http'
import { Inject, Service } from 'typedi'
import LoggerInstance from '../loaders/logger'
import ICron from './ICron'
import { MicroService } from './IMicroService'

@Service()
export class L4Provider {
    protected l3Provider: L3Provider

    constructor(
        @Inject('router') protected router: Router,
        @Inject('httpServer') protected httpServer: Server
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

@Service()
export class L3Provider {
    constructor(
        @Inject('eventHandler') protected eventHandler: EventEmitter,
        @Inject('jobScheduler') protected jobScheduler: ICron
    ) {}

    public GetService(serviceId: string): MicroService {
        if (serviceId) {
            const eventDispatcher = this.eventHandler
            const jobScheduler = this.jobScheduler
            const logger = LoggerInstance
            return new MicroService({ eventDispatcher, jobScheduler, logger })
        }
    }
}