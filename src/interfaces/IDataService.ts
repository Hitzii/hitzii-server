import { Document, Model } from "mongoose"
import { Logger } from "winston"
import ICron from "./dependencies/ICron"
import { L2Provider } from "./ILayer"

export class DataService {
    protected parentLayer: L2Provider
    protected model: Model<Document>

    constructor(
        protected jobScheduler: ICron,
        protected logger: Logger
    ) {
        this.jobScheduler = jobScheduler
        this.logger = logger
    }

    public SetParentLayer(l2Provider: L2Provider): void {
        this.parentLayer = l2Provider
    }
}