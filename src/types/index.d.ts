import { Model } from "mongoose";
import { IUserRecord } from "../interfaces/IUser";

declare global {
    namespace Models {
        export type UserModel = Model<IUserRecord & Document>
    }

    namespace DataServices {
        export type UserDataService = 
    }
}