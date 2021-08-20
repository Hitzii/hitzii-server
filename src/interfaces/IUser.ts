import { IAuthToken } from "./IAuthToken";
import { IMissingItems, IValidationWarning } from "./IUtils";

export interface IUserNameDTO {
    firstName: string
    lastName: string
}

export interface IUserInputDTO extends IUserNameDTO {
    email: string
    password: string
}

interface IOpenIDCredentials {
    provider: 'google' | 'facebook'
    email: string
    emailVerified: boolean
    sub: string
}

export interface IUserDocDTO {
    _id: string
    firstName: string
    lastName: string
    email: string
    emailVerified: boolean
    hashedPassword?: string
    salt?: string
    openID?: IOpenIDCredentials
    picture?: string
    organizations?: string[]
    billingInfo?: string
    subscriptions?: string[]
}

export interface IUserRecord {
    _id: string
    firstName: string
    lastName: string
    email: string
    emailVerified: boolean
    hashedPassword?: string
    salt?: string
    openID?: IOpenIDCredentials
    picture?: string
    organizations?: string[]
    billingInfo?: string
    subscriptions?: string[]
	createdAt: Date
	updatedAt: Date
}

export interface IUserInMemory {
    key: string
    firstName: string
    lastName: string
    email: string
    picture?: string
    organizations?: string[]
    workspaceViews?: string[]
    connection?: boolean
    missingItems?: IMissingItems
    warningMessage?: string
}

export interface IUserDisplay {
    _id: string
    firstName: string
    lastName: string
    email: string
    picture?: string
    organizations?: string[]
    isIncomplete?: boolean
}

export interface IResetUserPwd {
    new_password: string
}

export interface IChangeUserPwd extends IResetUserPwd {
    current_password: string
}

export interface IUserValidation {
    user: IUserDisplay
    warning: IValidationWarning | null
}

export interface IUserAuthPayload {
    user: IUserDisplay
    token: IAuthToken
    warning?: IValidationWarning
}