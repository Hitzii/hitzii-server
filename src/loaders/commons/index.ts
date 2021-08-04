import Container from "typedi"
import redisClient from "./redis"
import bsonInstance from "./bson"
import argon2Instance from "./argon2"
import cryptoInstance from "./crypto"
import jwtInstance from "./jwt"
import { createServer } from "http"
import { Router } from "express"
import LoggerInstance from "./logger"

export default () => {
    Container.set('logger', LoggerInstance)

    Container.set('redis', redisClient)

    Container.set('bson', bsonInstance)
    Container.set('argon2', argon2Instance)
    Container.set('crypto', cryptoInstance)
    Container.set('jwt', jwtInstance)

    Container.set('httpServer', createServer())
    Container.set('router', Router())
}