import { Router } from "express";
import { Server } from "http";
import { Inject } from "typedi";
import Layer from "../decorators/layer";
import { L4Provider } from "../interfaces/ILayer";
import RESTRouter from "./RESTRouter";

@Layer()
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