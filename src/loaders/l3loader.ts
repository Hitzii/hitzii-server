import EventEmitter from "events";
import Container from "typedi";
import ICron from "../interfaces/dependencies/ICron";
import { L2Provider, L3Provider } from "../interfaces/ILayer";
import { MicroService } from "../interfaces/IMicroService";
import { IServiceInfo } from "../interfaces/IServiceInfo";
import Services from "../services";


export default (l2Provider: L2Provider): L3Provider => {
    Container.set('l3.eventHandler', new EventEmitter())
    Container.set('l3.jobScheduler', new ICron())

    const serviceList: IServiceInfo[] = [
        {
            serviceName: 'auth',
            instance: require('../services/auth').default
        },
        {
            serviceName: 'thirdPartyAuth',
            instance: require('../services/thirdPartyAuth').default
        },
        {
            serviceName: 'user',
            instance: require('../services/user').default
        }
    ]

    serviceList.forEach(({ serviceName, instance }: IServiceInfo) => {
        const loadedInstance: MicroService = Container.get(instance)
        Container.set(`${serviceName}.microservice`, loadedInstance)
    })

    const l3Provider = Container.get<L3Provider>(Services)
    l3Provider.SetLowerLayer(l2Provider)
    return l3Provider
}