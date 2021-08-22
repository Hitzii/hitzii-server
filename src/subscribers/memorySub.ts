import Container from "typedi"
import Memory from "../memory"
import { EventSubscriber } from "../decorators/eventSubscriber"

const serviceProvider= Container.get(Memory)

@EventSubscriber(serviceProvider)
export default class MemorySubscriber {
    /* Method names must match with any existing event name */

    // private onEvent(payload: any): void {}
}