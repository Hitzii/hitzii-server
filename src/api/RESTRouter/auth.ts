import { celebrate, Joi } from "celebrate"
import { NextFunction, Request, Response, Router } from "express"
import { IBasicAuthedRequest } from "express-basic-auth"
import config from "../../config"
import { IAuthRequest, IRedirectURI, IRefreshToken, ITokenExchangeInput } from "../../interfaces/IAuthToken"
import { L3Provider } from "../../interfaces/ILayer"
import { IUserInputDTO, IUserNameDTO } from "../../interfaces/IUser"
import LoggerInstance from "../../loaders/commons/logger"
import isAuth from "../middleware/isAuth"
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
                state: Joi.string().required()
            }).required()
        }),
        async (req: IBasicAuthedRequest, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/signup with body \n%o', req.body)
            try {
                const { redirect_uri, state, client_id } = req.query as unknown as IAuthRequest

                if (client_id !== req.auth.user) {
                    throw new Error('Authenticated client id does not match the client_id provided in URL query')
                }

                const userInput: IUserInputDTO = req.body

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                const authRequest = { redirect_uri, state, client_id, grant_type: 'authorization_code' }

                const { authorization_code } = await authService.SignUp(userInput, authRequest)
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
                state: Joi.string().required()
            }).required()
        }),
        async (req: IBasicAuthedRequest, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/signin with body \n%o', req.body)
            try {
                const { redirect_uri, state, client_id } = req.query as unknown as IAuthRequest

                if (client_id !== req.auth.user) {
                    throw new Error('Authenticated client id does not match the client_id provided in URL query')
                }

                const { email, password }: Partial<IUserInputDTO> = req.body

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                const authRequest = { redirect_uri, state, client_id, grant_type: 'authorization_code' }

                const { authorization_code } = await authService.SignIn({ email, password }, authRequest)
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
            body: Joi.alternatives([
                Joi.object({
                    firstName: Joi.string().required(),
                    lastName: Joi.string().required()
                }),
                Joi.object({})
            ]),
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
            logger.debug('Calling /auth/token with body \n%o\n and query \n%o\n', req.body, req.query)
            try {
                const { grant_type } = req.query as unknown as IAuthRequest & ITokenExchangeInput

                if (grant_type === "authorization_code") {
                    const { client_id, redirect_uri, code, state } = req.query as unknown as IAuthRequest & ITokenExchangeInput

                    if (client_id !== req.auth.user) {
                        throw new Error('Authenticated client id does not match the client_id provided in URL query')
                    }

                    if (redirect_uri !== config.client.redirect_uri) {
                        throw new Error('Provided client redirect_uri does not match the registered URI')
                    }
                    const { firstName, lastName } : IUserNameDTO = req.body
    
                    const userName = (firstName && lastName) ? { firstName, lastName } : null
                    
                    const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                    const { user, token } = await authService.ValidateAuthCode({ grant_type, code, state }, client_id,  userName)
                    
                    return res.status(201).json({ user, token })
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
        celebrate({
            body: Joi.object({
                redirectURI: Joi.string().required()
            }),
            params: Joi.object({
                providerName: Joi.string().required()
            })
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/%s/signup with body \n%o', req.params.providerName, req.body)
            try {
                const thirdPartyAuthService = serviceProvider.GetService('thirdPartyAuth') as MicroServices.ThirdPartyAuth
                const { providerName } = req.params as { providerName: string }
                const { redirect_uri }: IRedirectURI = req.body
                const { authorization_uri } = thirdPartyAuthService.SignUp({ redirect_uri, providerName })
                return res.redirect(302, authorization_uri)
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
                code: Joi.string().required()
            }),
            params: Joi.object({
                providerName: Joi.string().required()
            })
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/%s/callback with query \n%o', req.params.providerName, req.query)
            try {
                const thirdPartyAuthService = serviceProvider.GetService('thirdPartyAuth') as MicroServices.ThirdPartyAuth
                const { providerName } = req.params as { providerName: string }
                const { code } = req.query as { code: string }
                const accountAndCode =  thirdPartyAuthService.ExchangeAuthToken({ authorization_code: code, providerName })
                return res.redirect(302, `https://client.example.com/auth?code=${accountAndCode.code}&display_name=${accountAndCode.accountName.displayName}`)
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.get(
        '/logout',
        isAuth,
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/logout for user %s', req.token.sub)
            try {
                const token = req.headers.authorization.split(' ')[1]

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                await authService.LogOut(token)

                return res.status(200).end()
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )

    route.get(
        '/close-sessions',
        isAuth,
        async (req: Request, res: Response, next: NextFunction) => {
            const logger = LoggerInstance
            logger.debug('Calling /auth/close-sessions for user %s', req.token.sub)
            try {
                const { sub } = req.token

                const authService = serviceProvider.GetService('auth') as MicroServices.Auth
                await authService.CloseAllSessions({ _id: sub })

                return res.status(200).end()
            } catch (error) {
                logger.error('Error: %o', error)
                return next(error)
            }
        }
    )
}