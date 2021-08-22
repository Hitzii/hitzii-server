import { IAuthorizationCode } from "../interfaces/IAuthToken"
import { IUserDisplay, IUserRecord } from "../interfaces/IUser"
import LoggerInstance from "../loaders/commons/logger"
import Container from "typedi"
import Services from "../services"
import { EventSubscriber } from "../decorators/eventSubscriber"

const serviceProvider= Container.get(Services)

@EventSubscriber(serviceProvider)
export default class ServiceSubscriber {
    /* Method names must match with any existing event name */

    private onUserSignUp(user: IUserDisplay): void {
        const logger = LoggerInstance
        logger.info('By eventSubscriber, userDisplay is %o', user)
    }

    private onUserSignIn(user: IUserRecord): void {
        const logger = LoggerInstance
        logger.info('By eventSubscriber, userRecord is %o', user)
    }

    private onAuthCodeIssued(authCode: IAuthorizationCode): void {
        const logger = LoggerInstance
        logger.info('By eventSubscriber, authCode is %o', authCode)
    }
}