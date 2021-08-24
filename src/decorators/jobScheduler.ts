import cron, { ScheduledTask } from 'node-cron'
import config from '../config'
import { Timezone } from 'tz-offset'
import { L1Provider, L2Provider, L3Provider } from "../interfaces/ILayer"
import { TaskEntry, TasksCollection } from '../interfaces/IJobScheduler'
import tasks from '../jobs/tasks'

export function JobScheduler(serviceProvider: L1Provider | L2Provider | L3Provider) {
    return function (constructor: Function) {
        constructor.prototype.scheduledTasks = {} as { [index: string]: ScheduledTask }
        constructor.prototype.serviceProvider = serviceProvider

        constructor.prototype.scheduleTasks = function(tasks: TasksCollection): void {
            Object.values(tasks).forEach(domain => {
                Object.values(domain).forEach(({ taskName, cronExpression }) => {
                    if (constructor.prototype[taskName]) {
                        const newTask = cron.schedule(cronExpression, constructor.prototype[taskName],
                            { timezone: config.timezone as Timezone, scheduled: false }
                        )
                        constructor.prototype.scheduledTasks[taskName] = newTask
                    }
                })
            })
        }
    
        constructor.prototype.getOnlyValidExpressions = function(tasks: TasksCollection): TasksCollection {
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

        const validTasks = constructor.prototype.getOnlyValidExpressions(tasks)
        constructor.prototype.scheduleTasks(validTasks)
    
        constructor.prototype.startScheduledTask = function(taskName: string): void {
            constructor.prototype.scheduledTasks[taskName].start()
        }
    
        constructor.prototype.stopScheduledTask = function(taskName: string): void {
            constructor.prototype.scheduledTasks[taskName].stop()
        }
    }
}