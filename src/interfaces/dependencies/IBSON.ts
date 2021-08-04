import { ObjectID } from "bson";

export default class IBSON {
    public createObjectId(id?: string | number | ObjectID): ObjectID {
        return new ObjectID(...arguments)
    }
}