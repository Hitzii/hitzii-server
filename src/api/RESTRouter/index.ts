import { NextFunction, Request, Response, Router, json, urlencoded } from "express";
import cors from 'cors';
import { L3Provider } from "../../interfaces/ILayer";
import auth from "./auth";
import user from "./user";

interface ErrorReq extends Error {
    status: number
}

export default ({ app, serviceProvider }: { app: Router, serviceProvider: L3Provider }): Router => {
    // Set up router helpers
    app.get('/status', (req: Request, res: Response) => {
        res.status(200).end()
    })

    app.head('/status', (req: Request, res: Response) => {
        res.status(200).end()
    })

    app.use(cors())

    app.use(require('method-override')())

    app.use(json())

    app.use(urlencoded({ extended: true }))

    // Load routes
    auth({ app, serviceProvider })
    user({ app, serviceProvider })

    // Handle request errors
    app.use((req: Request, res: Response, next: NextFunction) => {
        const err = new Error('Not Found')
        err['status'] = 404
        next(err)
    })

    app.use((err: ErrorReq, req: Request, res: Response, next: NextFunction) => {
        if (err.name === 'UnauthorizedError') {
            return res
                .status(err.status)
                .send({ message: err.message })
                .end()
        }
        return next(err)
    })

    app.use((err: ErrorReq, req: Request, res: Response, next: NextFunction) => {
        res.status(err.status || 500)
        res.json({
            errors: {
                message: err.message
            }
        })
    })

    return app
}