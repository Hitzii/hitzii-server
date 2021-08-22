import EventEmitter from "events";
import { L1Provider, L2Provider, L3Provider } from "./ILayer";

export type EventsCollection = { [index: string]: { [index: string]: string } }

export class Subscriber {
    protected eventEmitter: EventEmitter

    constructor(protected serviceProvider: L1Provider | L2Provider | L3Provider, events: EventsCollection) {
        this.serviceProvider = serviceProvider
        this.eventEmitter = new EventEmitter()
        this.addListeners(events)
    }

    private addListeners(events: EventsCollection): void {
        Object.values(events).forEach(domain => {
            Object.values(domain).forEach(eventName => {
                if (this[eventName]) this.eventEmitter.addListener(eventName, this[eventName])
            })
        })
    }

    public dispatch(event: string, payload: any): void {
        this.eventEmitter.emit(event, payload)
    }
}

export interface ISubscriber {
    serviceProvider: L1Provider | L2Provider | L3Provider
    dispatch(event: string, payload: any): void
}