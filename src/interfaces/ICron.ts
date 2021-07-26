import { ScheduleOptions, ScheduledTask } from 'node-cron'

export default interface ICron {
    schedule(expression: string, fuction: Function, options: ScheduleOptions): ScheduledTask
}