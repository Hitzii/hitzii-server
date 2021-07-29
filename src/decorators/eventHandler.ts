import Container from "typedi";
import { l3EventEmitter } from "../loaders/eventEmitter";

export function L3EventHandler() {
    return function (object: any, propertyName: string, index?: number) {
        const eventHandler = l3EventEmitter
        Container.registerHandler({ object, propertyName, index, value: () => eventHandler });
    }
}