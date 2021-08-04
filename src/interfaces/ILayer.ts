import EventEmitter from 'events'
import { Router } from 'express'
import { Server } from 'http'
import { Model } from 'mongoose'
import LoggerInstance from '../loaders/commons/logger'
import redisClient from '../loaders/commons/redis'
import ICron from './dependencies/ICron'
import { DataService } from './IDataService'
import { MemoryService } from './IMemoryService'
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

    public SetLowerLayer(l3Provider: L3Provider): void {
        this.l3Provider = l3Provider
    }
}

export class L3Provider {
    protected l2Provider: L2Provider

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

    public SetLowerLayer(l2Provider: L2Provider): void {
        this.l2Provider = l2Provider
    }

    public GetLowerLayer(): L2Provider {
        return this.l2Provider
    }
}

export class L2Provider {
    protected l1Provider: L1Provider

    constructor(
        protected eventHandler: EventEmitter,
        protected jobScheduler: ICron
    ) {}

    public GetService(serviceId: string): MemoryService {
        if (serviceId) {
            const eventDispatcher = this.eventHandler
            const jobScheduler = this.jobScheduler
            const logger = LoggerInstance
            return new MemoryService(eventDispatcher, jobScheduler, redisClient, logger)
        }
    }

    public SetLowerLayer(l1Provider: L1Provider): void {
        this.l1Provider = l1Provider
    }

    public GetLowerLayer(): L1Provider {
        return this.l1Provider
    }
}

export class L1Provider {
    constructor(
        protected eventHandler: EventEmitter,
        protected jobScheduler: ICron
    ) {}

    public GetService(serviceId: string): DataService {
        if (serviceId) {
            const eventDispatcher = this.eventHandler
            const jobScheduler = this.jobScheduler
            const model = new Model()
            const logger = LoggerInstance
            return new DataService(eventDispatcher, jobScheduler, logger)
        }
    }
}