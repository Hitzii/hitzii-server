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

		emailVerified: {
			type: Boolean,
			required: true
		},

		hashedPassword: String,

		salt: String,

		openID: {
			type: {
				provider: {
					type: String,
					required: true
				},
				email: {
					type: String,
					required: true
				},
				emailVerified: {
					type: Boolean,
					required: true
				},
				sub: {
					type: String,
					required: true
				}
			}
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