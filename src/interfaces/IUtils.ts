export interface IServiceInfo {
    serviceName: string
    instance: Function
}

export type IMissingItems = ('firstName' | 'lastName' | 'email' | 'authMethod' | 'email verification' | 'email uniqueness')[]

export interface IValidationWarning {
    message: string
    missing_items: IMissingItems
}