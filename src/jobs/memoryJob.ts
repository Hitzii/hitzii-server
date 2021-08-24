import Container from "typedi";
import { JobScheduler } from "../decorators/jobScheduler";
// import LoggerInstance from "../loaders/commons/logger";
import Memory from "../memory";

const serviceProvider = Container.get(Memory)

@JobScheduler(serviceProvider)
export default class MemoryJob  {

    // private printEverySecond(): void {
    //     const logger = LoggerInstance
    //     logger.silly('The current second is: %d', new Date().getSeconds())
    // }
}