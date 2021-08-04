import Container from "typedi"
import { l3jobScheduler, l2jobScheduler, l1jobScheduler } from "../loaders/nodeCron"

export function L1JobScheduler() {
    return function (object: any, propertyName: string, index?: number) {
        const jobScheduler = l1jobScheduler
        Container.registerHandler({ object, propertyName, index, value: () => jobScheduler });
    }
}

export function L2JobScheduler() {
    return function (object: any, propertyName: string, index?: number) {
        const jobScheduler = l2jobScheduler
        Container.registerHandler({ object, propertyName, index, value: () => jobScheduler });
    }
}

export function L3JobScheduler() {
    return function (object: any, propertyName: string, index?: number) {
        const jobScheduler = l3jobScheduler
        Container.registerHandler({ object, propertyName, index, value: () => jobScheduler });
    }
}