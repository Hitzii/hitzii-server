import { L1Provider, L2Provider, L3Provider } from "../interfaces/ILayer"
import { ISubscriber } from "../interfaces/ISubscriber"
import DataSubscriber from "../subscribers/dataSub"
import MemorySubscriber from "../subscribers/memorySub"
import ServiceSubscriber from "../subscribers/serviceSub"

export default ({ l1Provider, l2Provider, l3Provider }: { l1Provider: L1Provider, l2Provider: L2Provider, l3Provider: L3Provider }): void => {
    const dataSubscriberInstance = new DataSubscriber() as unknown as ISubscriber
    l1Provider.SetEventSubscriber(dataSubscriberInstance)

    const memorySubscriberInstance = new MemorySubscriber() as unknown as ISubscriber
    l2Provider.SetEventSubscriber(memorySubscriberInstance)

    const serviceSubscriberInstance = new ServiceSubscriber() as unknown as ISubscriber
    l3Provider.SetEventSubscriber(serviceSubscriberInstance)
}