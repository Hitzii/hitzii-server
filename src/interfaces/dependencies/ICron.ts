import cron, { ScheduleOptions, ScheduledTask } from 'node-cron'

export default class ICron {
    public schedule(expression: string, _function?: () => void, options?: ScheduleOptions): ScheduledTask {
        _function = _function ? _function : () => {}
        options = options ? options : {}
        return cron.schedule(expression, _function, options)
    }
}