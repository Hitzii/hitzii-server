import 'reflect-metadata'
// Now, we are able to use decorators for TypeScript

import cluster from 'cluster'
import os from 'os'
import { setupMaster } from '@socket.io/sticky'
import config from './config'
import { createServer } from 'http'
import Logger from './loaders/logger'

import express, { Router } from 'express'
// import API from './api'

const cpuCount = os.cpus().length

async function startServer() {
    const { port } = config

    const app = express()

    const httpServer = createServer(app)

    if (cluster.isMaster) {
        console.log(`Master ${process.pid} is running`)

        for (let i = 0; i < cpuCount; i++) {
            cluster.fork()
        }

        cluster.on('exit', worker => {
            console.log(`Worker ${worker.process.pid} died`)
            cluster.fork()
        })

        setupMaster(httpServer, {
            loadBalancingMethod: "least-connection"
        })
    
        httpServer.on('error', onError)
        httpServer.on('listening', onListening)
    
        /* Event listener for HTTP server "error" event. */
        
        function onError(error: any) {
            if (error.syscall !== 'listen') {
                throw error
            }
        
            let bind = ''
            if (typeof port === 'string') {
                bind = `Pipe ${port}`
            } else {
                bind = `Port ${port}`
            }
        
            // handle specific listen errors with friendly messages
            switch (error.code) {
                case "EACCES":
                    Logger.error(bind + " requires elevated privileges")
                    process.exit(1)
                case "EADDRINUSE":
                    Logger.error(bind + " is already in use")
                    process.exit(1)
                default:
                    Logger.error(error)
            }
        }
        
        /* Event listener for HTTP server "listening" event. */
        
        function onListening() {
            const address = httpServer.address()
            const { debugNamespace } = config
            let bind = ''
            if (typeof address === 'string') {
                bind = `pipe ${address}`
            } else {
                bind = `port ${address}`
            }
        
            if (process.env.NODE_ENV === 'development') {
                require('debug')(debugNamespace)(`Listening on ${address}`)
                Logger.info(`Server listening on port: ${port}`)
            }
        }
    } else {
        Logger.info(`Worker ${process.pid} started`)
    
        const restRouter = require('./loaders').default() as Router
        app.use(restRouter)
    
        httpServer.listen(port)
    }
}

startServer()