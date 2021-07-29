import EventEmitter from "events";
import Container from "typedi";
import ICron from "../interfaces/ICron";
import { L3Provider } from "../interfaces/ILayer";
import Services from "../services";

interface IServiceInfo {
    serviceName: string
    instance: Function
}

export default (): L3Provider => {
    Container.set('l3.eventHandler', new EventEmitter())
    Container.set('l3.jobScheduler', new ICron())

    const serviceList: IServiceInfo[] = [
        {
            serviceName: 'auth',
            instance: require('../services/auth').default
        }
    ]

    serviceList.forEach(({ serviceName, instance }: IServiceInfo) => {
        const loadedInstance = Container.get(instance)
        Container.set(`${serviceName}.microservices`, loadedInstance)
    })

    const l3Provider = Container.get<L3Provider>(Services)
    return l3Provider
}