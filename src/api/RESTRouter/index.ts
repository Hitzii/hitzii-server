import { Router } from "express";
import { L3Provider } from "../../interfaces/ILayer";
import auth from "./auth";

export default ({ app, serviceProvider }: { app: Router, serviceProvider: L3Provider }): Router => {
    auth({ app, serviceProvider })

    return app
}