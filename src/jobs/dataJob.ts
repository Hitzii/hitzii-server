import Container from "typedi";
import { JobScheduler } from "../decorators/jobScheduler";
// import LoggerInstance from "../loaders/commons/logger";
import PersistentData from "../persistentData";

const serviceProvider = Container.get(PersistentData)

@JobScheduler(serviceProvider)
export default class DataJob  {

    // private printEverySecond(): void {
    //     const logger = LoggerInstance
    //     logger.silly('The current second is: %d', new Date().getSeconds())
    // }
}