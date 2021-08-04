import argon2, { Options } from 'argon2'

export default class IArgon2 {
    public async hash(plain: Buffer | string, options?: Options & {raw?: false}): Promise<string> {
        if (options) {
            return await argon2.hash(plain, options)
        }
        
        return await argon2.hash(plain)
    }

    public async verify(hash: string, plain: Buffer | string, options?: Options): Promise<boolean> {
        if (options) {
            return await argon2.verify(hash, plain, options)
        }

        return await argon2.verify(hash, plain)
    }
}