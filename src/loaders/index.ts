import { createServer } from "http"
import { Router } from "express"
import API from "../api"
import Services from "../service"
import { EventEmitter } from "events"
import ICron from "../interfaces/ICron"
import Container from "typedi"

export default (): Router => {
    // Set common dependencies
    Container.set('eventHandler', new EventEmitter())
    Container.set('jobScheduler', new ICron())

    Container.set('httpServer', createServer())
    Container.set('router', Router())

    // Set layer 3
    const l3Provider = Container.get(Services)

    // Set layer 4
    const L4Provider = Container.get(API)
    L4Provider.SetLowerLayer(l3Provider)

    return L4Provider.GetRouter()
}