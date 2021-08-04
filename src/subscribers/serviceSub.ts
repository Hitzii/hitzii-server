import { IAuthorizationCode } from "../interfaces/IAuthToken";
import { IEventListener } from "../interfaces/dependencies/IEventListener";
import { IUserRecord } from "../interfaces/IUser";
import LoggerInstance from "../loaders/commons/logger";
import events from "./events";

const serviceSubscribers = [
    {
        event: events.user.signUp,
        listener: (user: IUserRecord) => {
            const logger = LoggerInstance
            logger.info('User signed up with record %o', user)
        }
    },
    {
        event: events.auth.codeIssued,
        listener: (authCode: IAuthorizationCode) => {
            const logger = LoggerInstance
            logger.info('Auth code issued: %s\n', authCode.authorization_code)
        }
    },
    // {
    //     event: events.auth.tokenRefrehed,
    //     listener: (cb: () => {}) => {
    //         const logger = LoggerInstance
    //         logger.info('Token refreshed. Revoking old token.')
    //         cb()
    //     }
    // },
    {
        event: events.user.signIn,
        listener: (user: IUserRecord) => {
            //
        }
    },
    {
        event: events.auth.codeRevoked,
        listener: (cb: () => {}) => {
            const logger = LoggerInstance
            logger.info('Code revoked due to error. Closing generated session')
            cb()
        }
    }
] as IEventListener[]

export default serviceSubscribers