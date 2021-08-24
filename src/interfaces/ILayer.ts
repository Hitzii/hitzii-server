import { Router } from 'express'
import { Server } from 'http'
import { Model } from 'mongoose'
import LoggerInstance from '../loaders/commons/logger'
import redisClient from '../loaders/commons/redis'
import { DataService } from './IDataService'
import { JobScheduler } from './IJobScheduler'
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
    private jobScheduler: JobScheduler

    constructor() {}

    public GetService(serviceId: string): MicroService {
        if (serviceId) {
            const logger = LoggerInstance
            return new MicroService(logger)
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

    public SetJobScheduler(jobScheduler: JobScheduler): void {
        this.jobScheduler = jobScheduler
    }

    public GetJobScheduler(): JobScheduler {
        return this.jobScheduler
    }
}

export class L2Provider {
    protected l1Provider: L1Provider
    private eventSubscriber: ISubscriber

    constructor() {}

    public GetService(serviceId: string): MemoryService {
        if (serviceId) {
            const logger = LoggerInstance
            return new MemoryService(redisClient, logger)
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
    
    constructor() {}

    public GetService(serviceId: string): DataService {
        if (serviceId) {
            const model = new Model()
            const logger = LoggerInstance
            return new DataService(logger)
        }
    }

    public SetEventSubscriber(subscriber: ISubscriber) {
        this.eventSubscriber = subscriber
    }

    public GetEventSubscriber(): ISubscriber {
        return this.eventSubscriber
    }
}