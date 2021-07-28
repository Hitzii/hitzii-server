import { Router } from "express";
import { Server } from "http";
import { L3Provider, L4Provider } from "../interfaces/ILayer";
import RESTRouter from "./RESTRouter";

export default class API extends L4Provider {
    constructor({ router, httpServer, l3Provider }: { router: Router, httpServer: Server, l3Provider: L3Provider }) {
        super({ router, httpServer, l3Provider })
    }

    public GetRouter() {
        return RESTRouter({ app: this.router, serviceProvider: this.l3Provider })
    }
}