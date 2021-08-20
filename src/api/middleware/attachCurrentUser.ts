import { Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import { Logger } from 'winston'
import { L3Provider } from '../../interfaces/ILayer'

const attachCurrentUser = (serviceProvider: L3Provider) => async (req: Request, res: Response, next: NextFunction) => {
    const Logger: Logger = Container.get('logger')

    try {
        const userService = serviceProvider.GetService('user') as MicroServices.User
        const userDisplay = await userService.GetDisplayData(req.token.sub)

        if (!userDisplay) {
            return res.sendStatus(401)
        }
        
        req.currentUser = userDisplay
        return next()
    } catch (error) {
        Logger.error('Error attaching user to req: %o', error)
        return next(error)
    }
}

export default attachCurrentUser