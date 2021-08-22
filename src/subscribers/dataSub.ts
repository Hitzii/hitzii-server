import Container from "typedi"
import PersistentData from "../persistentData"
import { EventSubscriber } from "../decorators/eventSubscriber"

const serviceProvider= Container.get(PersistentData)

@EventSubscriber(serviceProvider)
export default class DataSubscriber {
    /* Method names must match with any existing event name */

    // private onEvent(payload: any): void {}
}