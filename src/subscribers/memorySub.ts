import { IEventListener } from "../interfaces/dependencies/IEventListener"
import LoggerInstance from "../loaders/commons/logger"
import events from "./events"

const memorySubscribers = [
    {
        event: events.session.created,
        listener: (cb: () => {}) => {
            const logger = LoggerInstance
            logger.info('Session created. Registering new session for user')
            cb()
        }
    },
    {
        event: events.session.closed,
        listener: (cb: () => {}) => {
            const logger = LoggerInstance
            logger.info('Session closed. Unregistering expiring session for user')
            cb()
        }
    },
    {
        event: events.session.allClosed,
        listener: (cb: () => {}) => {
            const logger = LoggerInstance
            logger.info('All sessions closed. Unregistering all expiring session for user')
            cb()
        }
    },
    {
        event: events.session.refreshed,
        listener: (cb: () => {}) => {
            const logger = LoggerInstance
            logger.info('Session refreshed. Updating session entry for user')
            cb()
        }
    }
] as IEventListener[]

export default memorySubscribers