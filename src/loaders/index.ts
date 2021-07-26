import { Server } from "http"
import { Express as ExpressCore } from "express-serve-static-core"
import { Container } from "typedi"
import API from "../api"
import LoggerInstance from "./logger"

export default async ({ app, httpServer }: { app: ExpressCore|null, httpServer: Server|null }): Promise<API> => {
    // Set up common dependencies
    Container.set('logger', LoggerInstance)

    LoggerInstance.info('Common dependencies loaded')

    // Load API layer
    return new API({ app, httpServer })
}