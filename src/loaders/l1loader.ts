import Container from "typedi";
import ICron from "../interfaces/dependencies/ICron";
import { L1Provider } from "../interfaces/ILayer";
import { IServiceInfo } from "../interfaces/IUtils";
import PersistentData from "../persistentData";

export default (): L1Provider => {
    Container.set('l2.jobScheduler', new ICron())

    const serviceList: IServiceInfo[] = [
        {
            serviceName: 'user',
            instance: require('../persistentData/user').default
        }
    ]

    serviceList.forEach(({ serviceName, instance }: IServiceInfo) => {
        const loadedInstance = Container.get(instance)
        Container.set(`${serviceName}.dataservice`, loadedInstance)
    })

    const l1Provider = Container.get<L1Provider>(PersistentData)
    return l1Provider
}