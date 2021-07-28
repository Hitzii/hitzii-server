import { Router } from "express";
import { Server } from "http";
import { Inject, Service } from "typedi";
import { L4Provider } from "../interfaces/ILayer";
import RESTRouter from "./RESTRouter";

@Service()
export default class API extends L4Provider {
    constructor(
        @Inject('router') router: Router,
        @Inject('httpServer') httpServer: Server
    ) {
        super(router, httpServer)
    }

    public GetRouter() {
        return RESTRouter({ app: this.router, serviceProvider: this.l3Provider })
    }
}