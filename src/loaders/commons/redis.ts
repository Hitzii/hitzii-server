import Redis from 'ioredis'
import config from '../../config'

const redisClient = new Redis(config.redis.port, config.redis.uri)

export default redisClient