import { IJobScheduler } from "../interfaces/IJobScheduler"
import { L1Provider, L2Provider, L3Provider } from "../interfaces/ILayer"
import DataJob from "../jobs/dataJob"
import MemoryJob from "../jobs/memoryJob"
import ServiceJob from "../jobs/serviceJob"

export default ({ l1Provider, l2Provider, l3Provider }: { l1Provider: L1Provider, l2Provider: L2Provider, l3Provider: L3Provider }): void => {
    const dataJobInstance = new DataJob() as unknown as IJobScheduler
    l1Provider.SetJobScheduler(dataJobInstance)

    const memoryJobInstance = new MemoryJob() as unknown as IJobScheduler
    l2Provider.SetJobScheduler(memoryJobInstance)
    
    const serviceJobInstance = new ServiceJob() as unknown as IJobScheduler
    l3Provider.SetJobScheduler(serviceJobInstance)
}