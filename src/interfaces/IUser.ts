export interface IUserNameDTO {
    firstName: string
    lastName: string
}

export interface IUserInputDTO extends IUserNameDTO {
    email: string
    password: string
}

export interface IUserDocDTO {
    _id?: string
    firstName: string
    lastName: string
    email: string
    hashedPassword?: string
    salt?: string
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
    hashedPassword?: string
    salt?: string
    picture?: string
    organizations?: string[]
    billingInfo?: string
    subscriptions?: string[]
	createdAt: Date
	updatedAt: Date
}

export interface IUserInMemory {
    key?: string
    firstName: string
    lastName: string
    email: string
    picture?: string
    organizations?: string[]
    sessions?: string[]
}

export interface IUserDisplay {
    _id: string
    firstName: string
    lastName: string
    email: string
    picture?: string
    organizations?: string[]
}

export interface IAccountName {
    displayName: string
}

export interface IResetUserPwd {
    new_password: string
}

export interface IChangeUserPwd extends IResetUserPwd {
    current_password: string
}