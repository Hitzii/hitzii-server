import { createServer } from "http"
import { Router } from "express"
import Container from "typedi"
import LoggerInstance from "./logger"
import l4loader from "./l4loader"
import l3loader from "./l3loader"

export default (): Router => {
    // Set common dependencies
    Container.set('logger', LoggerInstance)

    Container.set('httpServer', createServer())
    Container.set('router', Router())

    LoggerInstance.debug('Common dependencies loaded')

    // Set layer 3
    const l3Provider = l3loader()

    // Set layer 4
    const l4Provider = l4loader(l3Provider)

    return l4Provider.GetRouter()
}