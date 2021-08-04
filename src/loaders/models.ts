import Container from "typedi"
import { IServiceInfo } from "../interfaces/IServiceInfo"

export default () => {
    const modelList: IServiceInfo[] = [
        {
            serviceName: 'user',
            instance: require('../models/User').default
        }
    ]

    modelList.forEach(({ serviceName, instance }: IServiceInfo) => {
        Container.set(`${serviceName}.model`, instance)
    })
}