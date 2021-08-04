import { celebrate, Joi } from "celebrate";
import { NextFunction, Request, Response, Router } from "express";
import config from "../../config";
import { L3Provider } from "../../interfaces/ILayer";
import { IChangeUserPwd } from "../../interfaces/IUser";
import LoggerInstance from "../../loaders/commons/logger";
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
}