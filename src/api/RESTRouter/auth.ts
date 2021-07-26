import { NextFunction, Request, Response, Router } from "express"
import { Express as ExpressCore } from "express-serve-static-core"
import { Container, ContainerInstance } from "typedi"
import { Logger } from "winston"
import Auth from "../../service/auth"

export default async ({ app, serviceProvider }: { app: ExpressCore, serviceProvider: ContainerInstance }) => {
    const route = Router()

    app.use('/auth', route)

    route.get(
        '',
        async (req: Request, res: Response, next: NextFunction) => {
            const logger: Logger = Container.get('logger')
            logger.debug(`Calling "/auth" endpoint with no body`)
            try {
                const authService = serviceProvider.get(Auth)
                const token = authService.GetToken()
                return res.status(200).json({ token })
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )
}