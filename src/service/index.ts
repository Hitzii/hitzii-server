import { Container, ContainerInstance, Inject } from "typedi";
import LoggerInstance from "../loaders/logger";
import Auth from "./auth";

export default class Service {
    private serviceProvider: ContainerInstance

    constructor(
        // @Inject('logger') private serviceProvider: Container
    ) {
        this.serviceProvider = new ContainerInstance('serviceProvider')
        this.setDependencies()
        this.setServices()
    }

    public GetProvider(): ContainerInstance {
        return this.serviceProvider
    }

    private setDependencies(): void {
        this.serviceProvider.set('logger', LoggerInstance)
    }

    private setServices(): void {
        this.serviceProvider.set('auth', Auth)
    }
}