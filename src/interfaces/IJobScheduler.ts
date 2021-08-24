import cron, { ScheduledTask } from 'node-cron'
import config from '../config'
import { Timezone } from 'tz-offset'
import { L1Provider, L2Provider, L3Provider } from "./ILayer"

export type TaskEntry = { taskName: string, cronExpression: string }
export type TasksCollection = { [index: string]: { [index: string]: TaskEntry } }

export class JobScheduler {
    protected scheduledTasks: { [index: string]: ScheduledTask } = {}

    constructor(protected serviceProvider: L1Provider | L2Provider | L3Provider, tasks: TasksCollection) {
        this.serviceProvider = serviceProvider
        const validTasks = this.getOnlyValidExpressions(tasks)
        this.scheduleTasks(validTasks)
    }

    private scheduleTasks(tasks: TasksCollection): void {
        Object.values(tasks).forEach(domain => {
            Object.values(domain).forEach(({ taskName, cronExpression }) => {
                if (this[taskName]) {
                    const newTask = cron.schedule(cronExpression, this[taskName],
                        { timezone: config.timezone as Timezone, scheduled: false }
                    )
                    this.scheduledTasks[taskName] = newTask
                }
            })
        })
    }

    private getOnlyValidExpressions(tasks: TasksCollection): TasksCollection {
        const validTasks: TasksCollection = {}
        
        Object.keys(tasks).forEach(domainName => {
            const domainTasks: { [index: string]: TaskEntry } = {}
            Object.keys(tasks[domainName]).forEach(taskEntryKey => {
                const { cronExpression } = tasks[domainName][taskEntryKey]
                const validExpression = cron.validate(cronExpression)
                if (validExpression) {
                    domainTasks[taskEntryKey] = tasks[domainName][taskEntryKey]
                }
            })
            validTasks[domainName] = domainTasks
        })

        return validTasks
    }

    public startScheduledTask(taskName: string): void {
        this.scheduledTasks[taskName].start()
    }

    public stopScheduledTask(taskName: string): void {
        this.scheduledTasks[taskName].stop()
    }
}