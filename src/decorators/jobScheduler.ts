import Container from "typedi";
import { l3jobScheduler } from "../loaders/nodeCron";

export function L3JobScheduler() {
    return function (object: any, propertyName: string, index?: number) {
        const jobScheduler = l3jobScheduler
        Container.registerHandler({ object, propertyName, index, value: () => jobScheduler });
    }
}