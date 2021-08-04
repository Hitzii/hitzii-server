import expressBasicAuth, { IBasicAuthedRequest } from "express-basic-auth"
import config from '../../config'

function authorizer(clientId: string, password: string): boolean {
    const idMatches = expressBasicAuth.safeCompare(clientId, config.client.id)
    const passwordMatches = expressBasicAuth.safeCompare(password, config.client.secret)

    return idMatches && passwordMatches
}

function unauthorizedResponse(req: IBasicAuthedRequest) {
    return req.auth
    ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
    : 'No credentials provided'
}

const isValidClient = expressBasicAuth({
    authorizer,
    unauthorizedResponse,
    challenge: true,
    realm: config.client.realm
})

export default isValidClient