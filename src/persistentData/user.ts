import EventEmitter from "events";
import { Inject, Service } from "typedi";
import { Logger } from "winston";
import { L1EventHandler } from "../decorators/eventHandler";
import { L1JobScheduler } from "../decorators/jobScheduler";
import DevLogger from "../decorators/logger";
import ICron from "../interfaces/dependencies/ICron";
import { DataService } from "../interfaces/IDataService";
import { IUserDocDTO, IUserRecord } from "../interfaces/IUser";

@Service()
export default class User extends DataService {
    @Inject('user.model')
    model: Models.User

    constructor(
        @L1EventHandler() eventDispatcher: EventEmitter,
        @L1JobScheduler() jobScheduler: ICron,
        @DevLogger() logger: Logger
    ) {
        super(eventDispatcher, jobScheduler, logger)
    }

    public async Create(userDoc: IUserDocDTO): Promise<IUserRecord> {
        const userRecord = await this.model.create(userDoc)
        return userRecord
    }

    public async UpdateById(_id: string, userDoc: Partial<IUserDocDTO>): Promise<IUserRecord> {
        const userRecord = await this.model.findByIdAndUpdate(_id, userDoc, { new: true })
        return userRecord
    }

    public async GetById(_id: string): Promise<IUserRecord> {
        const userRecord = await this.model.findById(_id)
        return userRecord
    }

    public async GetOneByField(field: string, value: any): Promise<IUserRecord> {
        const query = {}
        query[`${field}`] = value
        const userRecord = await this.model.findOne(query)
        this.logger.debug('userRecord is \n%o\n and query was \n%o\n', userRecord, query)
        return userRecord
    }
}