export interface IAuthToken {
	[index: string]: string | number

	access_token: string
	token_type: string
	expires_in: number
	refresh_token: string
}

export interface IAccessToken {
	sub: string
	aud: string
	name: string
	exp: number
	iat: number // issued date in seconds
	picture: string
}

export interface IAuthRequest {
	grant_type: string
	client_id: string
	redirect_uri: string
	state: string
}

export interface IAuthGrant extends IAuthRequest {
	user_id: string
	session?: string
}

export interface ITokenExchangeInput {
	grant_type: string
	code: string
	state: string
}

export interface IRedirectURI {
	redirect_uri: string
	providerName?: string
}

export interface IAuthorizationCode {
	authorization_code: string
}

export interface IThirdAuthCode extends IAuthorizationCode {
	providerName: string
}

export interface IRefreshToken {
	refresh_token: string
}

export interface IAuthorizationURI {
	authorization_uri: string
}

export interface IResetToken {
	reset_token: string
}