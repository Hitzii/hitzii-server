import { celebrate, Joi } from "celebrate"
import { NextFunction, Request, Response, Router } from "express"
import { IBasicAuthedRequest } from "express-basic-auth"
import config from "../../config"
import { IAuthRequest, IEmailVerificationRequest, IRecoveryRequest, IRedirectURI, IRefreshToken, IThirdAuthCallback, ITokenExchangeInput } from "../../interfaces/IAuthToken"
import { L3Provider } from "../../interfaces/ILayer"
import { IUserInputDTO, IUserNameDTO } from "../../interfaces/IUser"
import LoggerInstance from "../../loaders/commons/logger"
import attachCurrentUser from "../middleware/attachCurrentUser"
import isAuth from "../middleware/isAuth"
import isLegitAuth from "../middleware/isLegitAuth"
import isValidClient from "../middleware/isValidClient"
import { upload } from "../middleware/multer"

export default ({ app, serviceProvider }: { app: Router, serviceProvider: L3Provider }): void => {
    const route = Router()

    app.use('/auth', route)

    route.post(
        '/signup',
        isValidClient,
        upload.single('multi-file'),
        celebrate({
            body: Joi.object({
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                email: Joi.string().email().required(),
                password: Joi.string().required()
            }).required(),
            query: Joi.object({
                response_type: Joi.string().valid('code').required(),
                client_id: Joi.string().required(),
                redirect_uri: Joi.string().uri().valid(config.client.redirect_uri).required(),
                state: Joi.string().required(),
                nonce: Joi.string().required()
            }).required()
        }),
        async (req: IBasicAuthedRequest, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/signup with body \n%o', req.body)
            try {
                const { redirect_uri, state, client_id, nonce } = req.query as unknown as IAuthRequest

                if (client_id !== req.auth.user) {
                    throw new Error('Authenticated client id does not match the client_id provided in URL query')
                }

                const userInput: IUserInputDTO = req.body

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                const authRequest = { redirect_uri, state, client_id, nonce }

                const { authorization_code } = await authService.SignUp(userInput, { ...authRequest, grant_type: 'authorization_code' })
                const redirectionURI = `${redirect_uri}?code=${authorization_code}&state=${state}`
                return res.redirect(302, redirectionURI)
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.post(
        '/signin',
        isValidClient,
        celebrate({
            body: Joi.object({
                email: Joi.string().email().required(),
                password: Joi.string().required()
            }).required(),
            query: Joi.object({
                response_type: Joi.string().valid('code').required(),
                client_id: Joi.string().required(),
                redirect_uri: Joi.string().uri().valid(config.client.redirect_uri).required(),
                state: Joi.string().required(),
                nonce: Joi.string().required()
            }).required()
        }),
        async (req: IBasicAuthedRequest, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/signin with body \n%o', req.body)
            try {
                const { redirect_uri, state, client_id, nonce } = req.query as unknown as IAuthRequest

                if (client_id !== req.auth.user) {
                    throw new Error('Authenticated client id does not match the client_id provided in URL query')
                }

                const { email, password }: Partial<IUserInputDTO> = req.body

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                const authRequest = { redirect_uri, state, client_id, nonce }

                const { authorization_code } = await authService.SignIn({ email, password }, { ...authRequest, grant_type: 'authorization_code' })
                const redirectionURI = `${redirect_uri}?code=${authorization_code}&state=${state}`
                return res.redirect(302, redirectionURI)
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.post(
        '/token',
        isValidClient,
        celebrate({
            query: Joi.alternatives([
                Joi.object({
                    grant_type: Joi.string().valid('authorization_code', 'refresh_token').required(),
                    code: Joi.string().length(37).required(),
                    client_id: Joi.string(),
                    redirect_uri: Joi.string().uri().valid(config.client.redirect_uri).required(),
                    state: Joi.string().required()
                }),
                Joi.object({
                    grant_type: Joi.string().required(),
                    refresh_token: Joi.string().length(37).required()
                })
            ])
        }),
        async (req: IBasicAuthedRequest, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/token with query \n%o\n', req.query)
            try {
                const { grant_type } = req.query as unknown as IAuthRequest & ITokenExchangeInput

                if (grant_type === "authorization_code") {
                    const { client_id, redirect_uri, code, state } = req.query as unknown as IAuthRequest & ITokenExchangeInput

                    if (client_id !== req.auth.user) {
                        throw new Error('Authenticated client id does not match the client_id provided in URL query')
                    }
                    
                    const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                    const authUserPayload = await authService.ValidateAuthCode({ grant_type, code, state, redirect_uri }, client_id)

                    if (!authUserPayload) {
                        return res.status(204).json({ error: 'User authorization and account creation still pending.' })
                    }
                    
                    return res.status(201).json(authUserPayload)
                }

                if (grant_type === "refresh_token") {
                    const clientId = req.auth.user
                    const { refresh_token } = req.query as unknown as IRefreshToken
                    
                    const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                    const { user, token } = await authService.RefreshToken({ refresh_token }, clientId)
                    
                    return res.status(201).json({ user, token })
                }

            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.post(
        '/:providerName/signup',
        isValidClient,
        celebrate({
            query: Joi.object({
                response_type: Joi.string().valid('code').required(),
                client_id: Joi.string().required(),
                redirect_uri: Joi.string().uri().valid(config.client.redirect_uri).required(),
                state: Joi.string().required(),
                nonce: Joi.string().required(),
                login_hint: Joi.string()
            }).required(),
            params: Joi.object({
                providerName: Joi.string().valid('google', 'facebook').required()
            })
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/%s/signup with query \n%o', req.params.providerName, req.query)
            try {
                const { client_id, redirect_uri, state, nonce } = req.query as unknown as IAuthRequest
                const { providerName } = req.params
                const authRequest = {
                    grant_type: 'authorization_code',
                    client_id,
                    redirect_uri,
                    state,
                    nonce,
                    provider: providerName,
                    login_hint: req.query.login_hint ? req.query.login_hint : null
                } as IAuthRequest

                const thirdPartyAuthService = serviceProvider.GetService('thirdPartyAuth') as MicroServices.ThirdPartyAuth
                const authCodeAndProvider = await thirdPartyAuthService.SignUp(authRequest)

                return res.status(200).json(authCodeAndProvider)
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.post(
        '/:providerName/callback',
        celebrate({
            query: Joi.object({
                code: Joi.string().required(),
                state: Joi.string().required(),
                scope: Joi.string().required()
            }),
            params: Joi.object({
                providerName: Joi.string().required()
            })
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/%s/callback with query \n%o', req.params.providerName, req.query)
            try {
                const { code, state, scope } = req.query as unknown as IThirdAuthCallback
                const { providerName } = req.params
                
                const thirdPartyAuthService = serviceProvider.GetService('thirdPartyAuth') as MicroServices.ThirdPartyAuth
                await thirdPartyAuthService.ExchangeAuthCode(providerName, { code, state, scope })

                return res.status(200).end()
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.post(
        '/recover-account',
        isValidClient,
        celebrate({
            body: Joi.object({
                email: Joi.string().email().required()
            }),
            query: Joi.object({
                response_type: Joi.string().valid('code').required(),
                client_id: Joi.string().required(),
                redirect_uri: Joi.string().uri().valid(config.client.redirect_uri).required(),
                state: Joi.string().required(),
            }).required()
        }),
        async (req: IBasicAuthedRequest, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/recover-account with body \n%o\n and query \n%o\n', req.body, req.query)
            try {
                const { redirect_uri, state, client_id } = req.query as unknown as IRecoveryRequest
                const { email } = req.body as unknown as Partial<IUserInputDTO>

                if (client_id !== req.auth.user) {
                    throw new Error('Authenticated client id does not match the client_id provided in URL query')
                }

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                const recoveryRequest = { redirect_uri, state, client_id }

                await authService.RecoverAccount({ email }, recoveryRequest)

                return res.status(200).end()
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.get(
        '/reset-password',
        isValidClient,
        celebrate({
            query: Joi.object({
                code: Joi.string().required(),
                client_id: Joi.string(),
                redirect_uri: Joi.string().uri().valid(config.client.redirect_uri).required(),
                state: Joi.string().required()
            })
        }),
        async (req: IBasicAuthedRequest, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/reset-password with query \n%o', req.query)
            try {
                const { redirect_uri, state, client_id } = req.query as unknown as IRecoveryRequest
                const { code } = req.query
                
                if (client_id !== req.auth.user) {
                    throw new Error('Authenticated client id does not match the client_id provided in URL query')
                }

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                const recoveryRequest = { redirect_uri, state, client_id }

                const userDisplay = await authService.GetPwdResetter({ recovery_code: code as string }, recoveryRequest)

                return res.status(200).json(userDisplay)
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.post(
        '/reset-password',
        isValidClient,
        celebrate({
            body: Joi.object({
                new_password: Joi.string().required()
            }),
            query: Joi.object({
                code: Joi.string().required(),
                client_id: Joi.string(),
                redirect_uri: Joi.string().uri().valid(config.client.redirect_uri).required(),
                state: Joi.string().required()
            })
        }),
        async (req: IBasicAuthedRequest, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/reset-password with body \n%o\n and query \n%o\n', req.body, req.query)
            try {
                const { redirect_uri, state, client_id } = req.query as unknown as IRecoveryRequest
                const { code } = req.query
                const { new_password } = req.body
                
                if (client_id !== req.auth.user) {
                    throw new Error('Authenticated client id does not match the client_id provided in URL query')
                }

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                const recoveryRequest = { redirect_uri, state, client_id }

                const passwordReset = await authService.ResetPassword({ recovery_code: code as string }, recoveryRequest, { new_password })
                if (!passwordReset) {
                    return res.status(500).end()
                }

                return res.status(200).json({ message: 'Password reset succeed' })
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.get(
        '/verify-email',
        isAuth,
        celebrate({
            query: Joi.object({
                response_type: Joi.string().valid('code').required(),
                client_id: Joi.string().required(),
                redirect_uri: Joi.string().uri().valid(config.client.redirect_uri).required(),
                state: Joi.string().required(),
            }).required()
        }),
        isLegitAuth,
        attachCurrentUser(serviceProvider),
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/verify-email for user %s', req.token.sub)
            try {
                const { redirect_uri, state, client_id } = req.query as unknown as IEmailVerificationRequest
                const { email } = req.currentUser

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                const emailVerificationRequest = { redirect_uri, state, client_id }

                await authService.GetEmailVerification({ email }, emailVerificationRequest)

                return res.status(200).end()
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.post(
        '/verify-email',
        isAuth,
        celebrate({
            query: Joi.object({
                code: Joi.string().required(),
                client_id: Joi.string(),
                redirect_uri: Joi.string().uri().valid(config.client.redirect_uri).required(),
                state: Joi.string().required()
            }).required()
        }),
        isLegitAuth,
        attachCurrentUser(serviceProvider),
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/verify-email for user %s', req.token.sub)
            try {
                const { redirect_uri, state, client_id } = req.query as unknown as IEmailVerificationRequest
                const { code } = req.query

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                const emailVerificationRequest = { redirect_uri, state, client_id }

                const emailVerified = await authService.VerifyEmail({ email_verification_code: code as string }, emailVerificationRequest)
                if (!emailVerified) {
                    return res.status(500).end()
                }

                return res.status(200).json({ message: 'Email verified successfully' })
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.get(
        '/logout',
        isAuth,
        (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/logout for user %s', req.token.sub)
            try {
                const { sub } = req.token

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                authService.LogOut({ _id: sub })

                return res.status(200).end()
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )
}