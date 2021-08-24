import { JobScheduler, TasksCollection } from "../interfaces/IJobScheduler";
import { L3Provider } from "../interfaces/ILayer";
import LoggerInstance from "../loaders/commons/logger";

export default class ServiceJob extends JobScheduler {
    constructor(serviceProvider: L3Provider, tasks: TasksCollection) {
        super(serviceProvider, tasks)
    }

    private printEverySecond(): void {
        const logger = LoggerInstance
        logger.silly('The current second is: %d', new Date().getSeconds())
    }
}