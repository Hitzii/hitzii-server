import express from "express"
import { Express as ExpressCore } from "express-serve-static-core"
import { Server, createServer } from "http"
import Service from "../service"
// import { Inject } from "typedi"
import RESTRouter from "./RESTRouter"

export default class API {
    private L1Provider: Service
    private expressApp: ExpressCore
    private httpServer: Server

    constructor({ app, httpServer }: { app: ExpressCore|null, httpServer: Server|null }) {
        this.setLowerLayer(new Service())
        
        if (httpServer && app) {
            this.expressApp = app
            this.httpServer = httpServer
        } else {
            this.expressApp = express()
            this.httpServer = createServer(this.GetApp())
        }
    }

    public GetApp(): ExpressCore {
        const serviceProvider = this.L1Provider.GetProvider()
        return RESTRouter({ app: this.expressApp, serviceProvider })
    }

    public GetHTTPServer() : Server {
        return this.httpServer
    }

    private setLowerLayer(l1Provider: Service){
        this.L1Provider = l1Provider
    }
}