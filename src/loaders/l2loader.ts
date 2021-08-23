import Container from "typedi";
import { L1Provider, L2Provider } from "../interfaces/ILayer";
import { IServiceInfo } from "../interfaces/IUtils";
import Memory from "../memory";

export default (l1Provider: L1Provider): L2Provider => {
    const serviceList: IServiceInfo[] = [
        {
            serviceName: 'auth',
            instance: require('../memory/auth').default
        },
        {
            serviceName: 'emailVerification',
            instance: require('../memory/emailVerification').default
        },
        {
            serviceName: 'recovery',
            instance: require('../memory/recovery').default
        },
        {
            serviceName: 'user',
            instance: require('../memory/user').default
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