export interface ISessionInMemory {
	user: string
	workspaceViews: string[]
	connection: boolean
}

export interface ISessionDisplay extends ISessionInMemory {}