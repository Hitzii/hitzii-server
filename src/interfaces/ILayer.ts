import { Router } from 'express'
import { Server } from 'http'
import { Model } from 'mongoose'
import LoggerInstance from '../loaders/commons/logger'
import redisClient from '../loaders/commons/redis'
import ICron from './dependencies/ICron'
import { DataService } from './IDataService'
import { MemoryService } from './IMemoryService'
import { MicroService } from './IMicroService'
import { ISubscriber } from './ISubscriber'

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
    private eventSubscriber: ISubscriber

    constructor(
        protected jobScheduler: ICron
    ) {}

    public GetService(serviceId: string): MicroService {
        if (serviceId) {
            const jobScheduler = this.jobScheduler
            const logger = LoggerInstance
            return new MicroService(jobScheduler, logger)
        }
    }

    public SetLowerLayer(l2Provider: L2Provider): void {
        this.l2Provider = l2Provider
    }

    public GetLowerLayer(): L2Provider {
        return this.l2Provider
    }

    public SetEventSubscriber(subscriber: ISubscriber) {
        this.eventSubscriber = subscriber
    }

    public GetEventSubscriber(): ISubscriber {
        return this.eventSubscriber
    }
}

export class L2Provider {
    protected l1Provider: L1Provider
    private eventSubscriber: ISubscriber

    constructor(
        protected jobScheduler: ICron
    ) {}

    public GetService(serviceId: string): MemoryService {
        if (serviceId) {
            const jobScheduler = this.jobScheduler
            const logger = LoggerInstance
            return new MemoryService(jobScheduler, redisClient, logger)
        }
    }

    public SetLowerLayer(l1Provider: L1Provider): void {
        this.l1Provider = l1Provider
    }

    public GetLowerLayer(): L1Provider {
        return this.l1Provider
    }

    public SetEventSubscriber(subscriber: ISubscriber) {
        this.eventSubscriber = subscriber
    }

    public GetEventSubscriber(): ISubscriber {
        return this.eventSubscriber
    }
}

export class L1Provider {
    private eventSubscriber: ISubscriber
    
    constructor(
        protected jobScheduler: ICron
    ) {}

    public GetService(serviceId: string): DataService {
        if (serviceId) {
            const jobScheduler = this.jobScheduler
            const model = new Model()
            const logger = LoggerInstance
            return new DataService(jobScheduler, logger)
        }
    }

    public SetEventSubscriber(subscriber: ISubscriber) {
        this.eventSubscriber = subscriber
    }

    public GetEventSubscriber(): ISubscriber {
        return this.eventSubscriber
    }
}