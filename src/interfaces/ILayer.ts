import EventEmitter from 'events'
import { Router } from 'express'
import { Server } from 'http'
import LoggerInstance from '../loaders/logger'
import ICron from './ICron'
import { MicroService } from './IMicroService'

export class L4Provider {
    protected router: Router
    protected httpServer: Server
    protected l3Provider: L3Provider
    
    constructor({ router, httpServer, l3Provider }: { router: Router, httpServer: Server, l3Provider: L3Provider }) {
        this.router = router
        this.httpServer = httpServer
        this.setLowerLayer(l3Provider)
    }

    public GetRouter(): Router {
        return this.router
    }

    public GetHTTPServer() : Server {
        return this.httpServer
    }

    protected setLowerLayer(l3Provider: L3Provider) {
        this.l3Provider = l3Provider
    }
}

export class L3Provider {
    protected eventHandler: EventEmitter
    protected jobScheduler: ICron

    constructor({ eventHandler, jobScheduler }: { eventHandler: EventEmitter, jobScheduler: ICron }) {
        this.eventHandler = eventHandler
        this.jobScheduler = jobScheduler
    }

    public GetService(serviceId: string): MicroService {
        if (serviceId) {
            const eventDispatcher = this.eventHandler
            const jobScheduler = this.jobScheduler
            const logger = LoggerInstance
            return new MicroService({ eventDispatcher, jobScheduler, logger })
        }
    }
}