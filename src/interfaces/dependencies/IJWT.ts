import jwt, { Secret, SignOptions } from "jsonwebtoken"

export default class IJWT {
    public sign(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions): string {
        if (options) {
            return jwt.sign(payload, secretOrPrivateKey, options)
        }
        
        return jwt.sign(payload, secretOrPrivateKey)
    }
}