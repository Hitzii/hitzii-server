export interface IAuthToken {
	[index: string]: string | number

	access_token: string
	token_type: string
	expires_in: number
	refresh_token: string
}

export interface IThirdAuthToken extends IAuthToken {
	id_token: string
	scope: string
}

export interface IAccessToken {
	iss: string
	sub: string
	aud: string
	name: string
	exp: number
	iat: number // issued date in seconds
	nonce: string
	picture: string
	given_name: string
	family_name: string
	email: string
	email_verified: string
}

export interface IThirdIDToken extends IAccessToken {
	azp: string
	at_hash: string
	hd: string
}

export interface IAuthRequest {
	grant_type: 'authorization_code' | 'refresh_token'
	client_id: string
	redirect_uri: string
	state: string
	nonce: string
	login_hint?: string
	provider?: 'google' | 'facebook'
	third_party_token?: string
}

export interface IAuthGrant extends IAuthRequest {
	user_id: string
}

export interface IRecoveryRequest {
	client_id: string
	redirect_uri: string
	state: string
}

export interface IRecoveryGrant extends IRecoveryRequest {
	user_id: string
}

export interface IEmailVerificationRequest extends IRecoveryRequest {}

export interface IEmailVerificationGrant extends IRecoveryGrant {}

export interface ITokenExchangeInput {
	grant_type: string
	code: string
	state: string
	redirect_uri: string
}

export interface IRedirectURI {
	redirect_uri: string
}

export interface IAuthorizationCode {
	authorization_code: string
}

export interface IThirdAuthCode extends IAuthorizationCode {
	providerName: string
}

export interface IRecoveryCode {
	recovery_code: string
}

export interface IEmailVerificationCode {
	email_verification_code: string
}

export interface IThirdAuthCallback {
	code: string
	state: string
	scope: string
}

export interface IRefreshToken {
	refresh_token: string
}

export interface IAuthorizationURI extends IAuthorizationCode {
	authorization_uri: string
}