export interface ISessionDisplay {
	user: string
	workspaceViews?: string[]
	connection: boolean
}

export interface ISessionInMemory extends ISessionDisplay {
	key?: string
}