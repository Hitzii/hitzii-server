import { MicroService } from "../interfaces/IMicroService"

export default class Auth extends MicroService {
    constructor({ eventDispatcher, jobScheduler, logger }) {
        super({ eventDispatcher, jobScheduler, logger })
    }

    public GetToken(): string {
        return 'Pocoyo!'
    }
}