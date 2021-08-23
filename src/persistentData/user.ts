import { Inject, Service } from "typedi";
import { Logger } from "winston";
import DevLogger from "../decorators/logger";
import { DataService } from "../interfaces/IDataService";
import { IUserDocDTO, IUserRecord } from "../interfaces/IUser";

@Service()
export default class User extends DataService {
    @Inject('user.model')
    model: Models.User

    constructor(
        @DevLogger() logger: Logger
    ) {
        super(logger)
    }

    public async Create(userDoc: IUserDocDTO): Promise<IUserRecord> {
        const userRecord = await this.model.create(userDoc)
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
        return userRecord
    }

    public async UpdateById(_id: string, userDoc: Partial<IUserDocDTO>): Promise<IUserRecord> {
        const userRecord = await this.model.findByIdAndUpdate(_id, userDoc, { new: true })
        return userRecord
    }

    public async DeleteById(_id: string): Promise<void> {
        await this.model.findByIdAndDelete(_id)
    }
}