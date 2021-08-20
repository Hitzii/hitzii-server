import jwt, { DecodeOptions, JwtPayload, Secret, SignOptions } from "jsonwebtoken"

export default class IJWT {
    public sign(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions): string {
        if (options) {
            return jwt.sign(payload, secretOrPrivateKey, options)
        }
        
        return jwt.sign(payload, secretOrPrivateKey)
    }

    public decode(token: string, options?: DecodeOptions): null | JwtPayload | string {
        if (options) {
            return jwt.decode(token, options)
        }

        return jwt.decode(token)
    }
}