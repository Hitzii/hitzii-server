export interface IAuthToken {
	access_token: string
	token_type: string
	expires_in: number
	refresh_token: string
}

export interface IAccessToken {
	sub: string
	name: string
	exp: number
	iat: Date
	picture: string
}

export interface ITokenExchangeInput {
	grant_type: string
	code: string
}

export interface IRedirectURI {
	redirectURI: string
}