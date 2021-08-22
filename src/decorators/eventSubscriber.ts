import EventEmitter from "events"
import { L1Provider, L2Provider, L3Provider } from "../interfaces/ILayer"
import { EventsCollection } from "../interfaces/ISubscriber"
import events from "../subscribers/events"

export function EventSubscriber(serviceProvider: L1Provider | L2Provider | L3Provider) {
    return function(constructor: Function) {
        constructor.prototype.serviceProvider = serviceProvider
        constructor.prototype.eventEmitter = new EventEmitter()

        constructor.prototype.addListeners = function(events: EventsCollection): void {
            Object.values(events).forEach(domain => {
                Object.values(domain).forEach(eventName => {
                    if (constructor.prototype[eventName]) constructor.prototype.eventEmitter.addListener(eventName, constructor.prototype[eventName])
                })
            })
        }

        constructor.prototype.addListeners(events)

        constructor.prototype.dispatch = function(event: string, payload: any): void {
            constructor.prototype.eventEmitter.emit(event, payload)
        }
    }
}
  