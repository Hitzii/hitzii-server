import EventEmitter from "events"
import memorySubscribers from "../subscribers/memorySub"
import serviceSubscribers from "../subscribers/serviceSub"

const l1EventEmitter = new EventEmitter()
memorySubscribers.forEach(({ event, listener}) => {
    l1EventEmitter.addListener(event, listener)
})

const l2EventEmitter = new EventEmitter()
memorySubscribers.forEach(({ event, listener}) => {
    l2EventEmitter.addListener(event, listener)
})

const l3EventEmitter = new EventEmitter()
serviceSubscribers.forEach(({ event, listener}) => {
    l3EventEmitter.addListener(event, listener)
})

export {
    l2EventEmitter,
    l3EventEmitter,
    l1EventEmitter
}