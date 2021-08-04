import { Model } from "mongoose"
import { IUserRecord } from "../interfaces/IUser"

import * as UserDataService from '../persistentData/user'

import * as AuthMemoryService from '../memory/auth'
import * as SessionMemoryService from '../memory/session'
import * as UserMemoryService from '../memory/user'

import * as AuthMicroService from '../services/auth'
import * as ThirdPartyAuthMicroService from '../services/thirdPartyAuth'
import * as UserMicroService from '../services/user'

import { IAccessToken } from "../interfaces/IAuthToken"

declare global {
    namespace Models {
        export type User = Model<IUserRecord & Document>
    }

    namespace DataServices {
        export type User = UserDataService.default
    }

    namespace MemoryServices {
        export type Auth = AuthMemoryService.default
        export type Session = SessionMemoryService.default
        export type User = UserMemoryService.default
    }

    namespace MicroServices {
        export type Auth = AuthMicroService.default
        export type ThirdPartyAuth = ThirdPartyAuthMicroService.default
        export type User = UserMicroService.default
    }

    namespace Express {
        export interface Request{
            token: IAccessToken
        }
    }
}