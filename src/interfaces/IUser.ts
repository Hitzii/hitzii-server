export interface IUserInputDTO {
    name: string
    email: string
    password: string
}

export interface IUserDocDTO {
    _id?: string
    firstName: string
    lastName: string
    email: string
    hashedPassword: string
    salt: string
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
    hashedPassword: string
    salt: string
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
    sessions: string[]
}

export interface IUserDisplay {
    _id: string
    firstName: string
    lastName: string
    email: string
    picture?: string
    organizations?: string[]
}