import { Logger } from "winston"
import ICron from "./dependencies/ICron"
import { L3Provider } from "./ILayer"

export class MicroService {
    protected parentLayer: L3Provider

    constructor(
        protected jobScheduler: ICron,
        protected logger: Logger
    ) {
        this.jobScheduler = jobScheduler
        this.logger = logger
    }

    public SetParentLayer(l3Provider: L3Provider): void {
        this.parentLayer = l3Provider
    }
}