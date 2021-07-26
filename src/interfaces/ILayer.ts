import EventEmitter from 'events'
import { EventHandler } from '../decorators/eventHandler'
import { JobScheduler } from '../decorators/jobScheduler'
import { Layer } from '../decorators/layer'
import ICron from './ICron'

@Layer()
class ToolsProvider {
    constructor(
        @EventHandler() protected eventHandler: EventEmitter,
        @JobScheduler() protected jobSchedule: ICron
    ) {}
}

@Layer()
export class L1Provider extends ToolsProvider {
    constructor(
        eventHandler: EventEmitter,
        jobScheduler: ICron
    ) {
        super(eventHandler, jobScheduler)
    }

    [index: string]: any
}

@Layer()
export class L2Provider extends ToolsProvider {
    protected L1Provider: L1Provider
    
    constructor(
        eventHandler: EventEmitter,
        jobScheduler: ICron
    ) {
        super(eventHandler, jobScheduler)
    }

    [index: string]: any

    public setLowerLayer(L1Provider: L1Provider): void {
        this.L1Provider = L1Provider
    }
}

@Layer()
export class L3Provider extends ToolsProvider {
    protected L2Provider: L2Provider

    constructor(
        eventHandler: EventEmitter,
        jobScheduler: ICron
    ) {
        super(eventHandler, jobScheduler)
    }

    [index: string]: any

    public setLowerLayer(L2Provider: L2Provider): void {
        this.L2Provider = L2Provider
    }
}

@Layer()
export class L4Provider {
    protected L3Provider: L3Provider

    [index: string]: any

    public setLowerLayer(L3Provider: L3Provider): void {
        this.L3Provider = L3Provider
    }
}