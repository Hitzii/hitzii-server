import { Document, model, Schema, SchemaTypes } from 'mongoose'
import { IUserRecord } from '../interfaces/IUser'

const User = new Schema(
    {
		firstName: {
			type: String,
			required: [true, 'Please enter a full name'],
			index: true,
		},

		lastName: {
			type: String,
			required: [true, 'Please enter a full name'],
			index: true,
		},

		email: {
			type: String,
			lowercase: true,
			unique: true,
			index: true,
		},

		hashedPassword: {
			type: String,
			required: true
		},

		salt: {
			type: String,
			required: true
		},

		picture: String,

		organizations: [{
			type: SchemaTypes.ObjectId,
			ref: 'Organization'
		}],

		billingInfo: {
			type: SchemaTypes.ObjectId,
			ref: 'Billing'
		},

		subscriptions: [{
			type: SchemaTypes.ObjectId,
			ref: 'Subscription'
		}]
    },
    { timestamps: true }
)

export default model<IUserRecord & Document>('User', User)