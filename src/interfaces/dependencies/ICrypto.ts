import { randomBytes } from "crypto";

export default class ICrypto {
    public randomBytes(size: number, callback?: (err: Error | null, buf: Buffer) => void): Buffer | void {
        if (callback) {
            randomBytes(size, callback)
        } else {
            return randomBytes(size)
        }
    }
}