import Container from "typedi";
import LoggerInstance from "../loaders/commons/logger";

export default function DevLogger() {
    return function (object: any, propertyName: string, index?: number) {
        const logger = LoggerInstance;
        Container.registerHandler({ object, propertyName, index, value: () => logger });
    }
}