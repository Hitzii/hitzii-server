import { createServer } from "http"
import { Router } from "express"
import API from "../api"
import Services from "../service"
import { EventEmitter } from "events"
import ICron from "../interfaces/ICron"

export default (): Router => {
    // Set layer 3
    const eventHandler = new EventEmitter()
    const jobScheduler = new ICron()
    const l3Provider = new Services({ eventHandler, jobScheduler })

    // Set layer 4
    const httpServer = createServer()
    const router = Router()

    return (new API({ router, httpServer, l3Provider })).GetRouter()
}