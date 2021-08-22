import mongooseLoader from "./mongoose"
import LoggerInstance from "./commons/logger"
import { Router } from "express"
import modelsLoader from "./models"
import l1loader from "./l1loader"
import l2loader from "./l2loader"
import l3loader from "./l3loader"
import l4loader from "./l4loader"
import commonsLoader from "./commons"

export default async (): Promise<Router> => {
    // Connect to DB
    await mongooseLoader()
    LoggerInstance.info('DB loaded and connected')
    
    // Set common dependencies
    await commonsLoader()
    LoggerInstance.debug('Common dependencies loaded')

    // Set DB models
    modelsLoader()

    // Set layer 1
    const l1Provider = l1loader()

    // Set layer 2
    const l2Provider = l2loader(l1Provider)

    // Set layer 3
    const l3Provider = l3loader(l2Provider)

    // Set layer 4
    const l4Provider = l4loader(l3Provider)

    // Set event subscribers
    const eventSubscribersLoader = require('./eventSubscribers').default
    eventSubscribersLoader({ l1Provider, l2Provider, l3Provider })

    return l4Provider.GetRouter()
}