import { Express as ExpressCore } from "express-serve-static-core"
import { ContainerInstance } from "typedi"
import auth from "./auth"

export default ({ app, serviceProvider }: { app: ExpressCore, serviceProvider: ContainerInstance }): ExpressCore => {
    auth({ app, serviceProvider })
    
    return app
}