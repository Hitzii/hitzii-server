import { createTransport, Transporter } from 'nodemailer'
import config from '../../config'

const { SMTP } = config

export default async (): Promise<Transporter> => {
    const mailerTransport = createTransport({
        port: SMTP.port,
        host: SMTP.host,
        // secure: true,
        pool: true,
        auth: {
            user: SMTP.user,
            pass: SMTP.pass
        },
        // tls: {
        //     rejectUnauthorized: false
        // }
    })

    let transportVerified = await mailerTransport.verify()

    if (!transportVerified) {
        throw new Error('Mailer transporter connection failed or timed out')
    }

    return mailerTransport
}