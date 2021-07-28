import { NextFunction, Request, Response, Router } from "express"
// import { Container } from "typedi"
// import { Logger } from "winston"
import { L3Provider } from "../../interfaces/ILayer"
import LoggerInstance from "../../loaders/logger"
import Auth from "../../service/auth"

export default ({ app, serviceProvider }: { app: Router, serviceProvider: L3Provider }): void => {
    const route = Router()

    app.use('/auth', route)

    route.get(
        '',
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug(`Calling "/auth" endpoint with no body`)
            try {
                const authService = serviceProvider.GetService('auth-microservice') as Auth
                const token = authService.GetToken()
                return res.status(200).json({ token })
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )
}