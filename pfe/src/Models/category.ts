import { Schema, model } from 'mongoose';
import Joi from 'joi';
import { ICategory } from '../Interfaces/category/ICategory';

// Validation schema
export const CategorySchemaValidate = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
});

// Category Schema
const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String },
        properties: [{ type: Schema.Types.ObjectId, ref: 'Property' }], // Reference to Property
    },
    { timestamps: true } // Adds createdAt and updatedAt automatically
);

export const Category = model<ICategory>('Category', categorySchema);