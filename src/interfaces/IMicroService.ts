import { Logger } from "winston"
import { L3Provider } from "./ILayer"
import { ISubscriber } from "./ISubscriber"

export class MicroService {
    protected parentLayer: L3Provider
    protected eventDispatcher: ISubscriber

    constructor(
        protected logger: Logger
    ) {
        this.logger = logger
    }

    public SetParentLayer(l3Provider: L3Provider): void {
        this.parentLayer = l3Provider
        this.setEventDispatcher(l3Provider.GetEventSubscriber())
    }

    private setEventDispatcher(dispatcher: ISubscriber): void {
        this.eventDispatcher = dispatcher
    }
}