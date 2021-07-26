import { Inject, Service } from "typedi";
import { Logger } from "winston";

@Service()
export default class Auth {
    constructor(
        @Inject('logger') private logger: Logger
    ) {}

    public GetToken(): string {
        return 'Pocoyo!'
    }
}