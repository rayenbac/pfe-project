import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { ITransaction } from '../Interfaces/transaction/ITransaction';

// Validation schema
export const TransactionSchemaValidate = Joi.object({
    buyer: Joi.string().required(),    // Keep as string for validation
    seller: Joi.string().required(),   // Keep as string for validation
    property: Joi.string().required(), // Keep as string for validation
    amount: Joi.number().required(),
    status: Joi.string().valid("pending", "completed", "cancelled").default("pending")
});

// Schema
const transactionSchema = new Schema<ITransaction>(
    {
        buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
    },
    { timestamps: true }
);

export const Transaction = model<ITransaction>('Transaction', transactionSchema);