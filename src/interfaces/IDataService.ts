import { Redis } from "ioredis";
import { Inject } from "typedi";

export default class IDataService {
    constructor(
        @Inject('redis') protected redis: Redis
    ) {}
}