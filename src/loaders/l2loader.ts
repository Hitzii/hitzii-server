import EventEmitter from "events";
import Container from "typedi";
import ICron from "../interfaces/dependencies/ICron";
import { L1Provider, L2Provider } from "../interfaces/ILayer";
import { IServiceInfo } from "../interfaces/IServiceInfo";
import Memory from "../memory";

export default (l1Provider: L1Provider): L2Provider => {
    Container.set('l2.eventHandler', new EventEmitter())
    Container.set('l2.jobScheduler', new ICron())

    const serviceList: IServiceInfo[] = [
        {
            serviceName: 'auth',
            instance: require('../memory/auth').default
        },
        {
            serviceName: 'user',
            instance: require('../memory/user').default
        },
        {
            serviceName: 'session',
            instance: require('../memory/session').default
        }
    ]

    serviceList.forEach(({ serviceName, instance }: IServiceInfo) => {
        const loadedInstance = Container.get(instance)
        Container.set(`${serviceName}.memoryservice`, loadedInstance)
    })

    const l2Provider = Container.get<L2Provider>(Memory)
    l2Provider.SetLowerLayer(l1Provider)
    return l2Provider
}