import { L1Provider, L2Provider, L3Provider } from "../interfaces/ILayer"
import ServiceJob from "../jobs/serviceJob"
import tasks from "../jobs/tasks"

export default ({ l1Provider, l2Provider, l3Provider }: { l1Provider: L1Provider, l2Provider: L2Provider, l3Provider: L3Provider }): void => {
    const serviceJobInstance = new ServiceJob(l3Provider, tasks)
    l3Provider.SetJobScheduler(serviceJobInstance)
}