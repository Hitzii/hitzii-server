import Container from "typedi";
import { JobScheduler } from "../decorators/jobScheduler";
import LoggerInstance from "../loaders/commons/logger";
import Services from "../services";

const serviceProvider = Container.get(Services)

@JobScheduler(serviceProvider)
export default class ServiceJob  {

    private printEverySecond(): void {
        const logger = LoggerInstance
        logger.silly('The current second is: %d', new Date().getSeconds())
    }
}