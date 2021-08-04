export interface IEventListener {
    event: string | symbol
    listener: (...args: any[]) => void
}