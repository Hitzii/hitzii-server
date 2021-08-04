import { NextFunction, Request, Response } from "express";
import Container from "typedi";
import { Logger } from "winston";

const isLegitAuth = async (req: Request, res: Response, next: NextFunction) => {
    const Logger: Logger = Container.get('logger')

    try {
        const client_id = req.query.client_id as string
        const { aud } = req.token

        if (client_id !== aud) {
            return res.status(401).end()
        }

        return next()
    } catch (error) {
        Logger.error('Error authenticating token legitimacy: %o', error)
        return next(error)
    }
}

export default isLegitAuth