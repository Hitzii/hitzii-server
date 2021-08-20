import { celebrate, Joi } from "celebrate";
import { NextFunction, Request, Response, Router } from "express";
import config from "../../config";
import { L3Provider } from "../../interfaces/ILayer";
import { IChangeUserPwd, IUserInputDTO } from "../../interfaces/IUser";
import LoggerInstance from "../../loaders/commons/logger";
import attachCurrentUser from "../middleware/attachCurrentUser";
import isAuth from "../middleware/isAuth";
import isLegitAuth from "../middleware/isLegitAuth";

export default ({ app, serviceProvider }: { app: Router, serviceProvider: L3Provider }): void => {
    const route = Router()

    app.use('/user', route)

    route.post(
        '/change-password',
        isAuth,
        celebrate({
            body: Joi.object({
                new_password: Joi.string().required(),
                current_password: Joi.string().required()
            }),
            query: Joi.object({
                client_id: Joi.string().valid(config.client.id).required()
            }).required()
        }),
        isLegitAuth,
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /user/change-password with body \n%o', req.body)
            try {
                const userId = req.token.sub
                const { new_password, current_password } = req.body as IChangeUserPwd

                const userService = serviceProvider.GetService('user') as MicroServices.User
                await userService.ChangePassword(userId, { new_password, current_password })

                return res.status(200).end()
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.get(
        '/missing-data',
        isAuth,
        celebrate({
            query: Joi.object({
                client_id: Joi.string().valid(config.client.id).required()
            }).required()
        }),
        isLegitAuth,
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /user/missing-data')
            try {
                const userService = serviceProvider.GetService('user') as MicroServices.User
                const { user, warning } = await userService.GetUserValidation(req.token.sub)
                return res.status(200).json({ user, warning })
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.post(
        '/missing-data',
        isAuth,
        celebrate({
            body: Joi.object({
                firstName: Joi.string(),
                lastName: Joi.string(),
                email: Joi.string().email(),
                password: Joi.string()
            }),
            query: Joi.object({
                client_id: Joi.string().valid(config.client.id).required()
            }).required()
        }),
        isLegitAuth,
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /user/missing-data')
            try {
                const { sub } = req.token
                const userInput = req.body as Partial<IUserInputDTO>

                const userService = serviceProvider.GetService('user') as MicroServices.User
                const { user, warning } = await userService.UpdateMissingItems(sub, userInput)
                return res.status(200).json({ user, warning })
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.get(
        '/me',
        isAuth,
        celebrate({
            query: Joi.object({
                client_id: Joi.string().valid(config.client.id).required()
            }).required()
        }),
        isLegitAuth,
        attachCurrentUser(serviceProvider),
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /user/me')
            try {
                return res.status(200).json(req.currentUser)
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.patch(
        '/me',
        isAuth,
        celebrate({
            body: Joi.object({
                firstName: Joi.string(),
                lastName: Joi.string(),
                email: Joi.string()
            }),
            query: Joi.object({
                client_id: Joi.string().valid(config.client.id).required()
            }).required()
        }),
        isLegitAuth,
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /user/me')
            try {
                const { sub } = req.token
                const userInput = req.body as Partial<IUserInputDTO>
                
                const userService = serviceProvider.GetService('user') as MicroServices.User
                const userPayload = await userService.UpdateBasicData(sub, userInput)

                return res.status(200).json(userPayload)
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )
}