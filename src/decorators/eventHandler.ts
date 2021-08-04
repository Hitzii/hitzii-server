import Container from "typedi"
import { l3EventEmitter, l2EventEmitter, l1EventEmitter } from "../loaders/eventEmitter"

export function L1EventHandler() {
    return function (object: any, propertyName: string, index?: number) {
        const eventHandler = l1EventEmitter
        Container.registerHandler({ object, propertyName, index, value: () => eventHandler });
    }
}

export function L2EventHandler() {
    return function (object: any, propertyName: string, index?: number) {
        const eventHandler = l2EventEmitter
        Container.registerHandler({ object, propertyName, index, value: () => eventHandler });
    }
}

export function L3EventHandler() {
    return function (object: any, propertyName: string, index?: number) {
        const eventHandler = l3EventEmitter
        Container.registerHandler({ object, propertyName, index, value: () => eventHandler });
    }
}