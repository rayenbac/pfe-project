import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { IPost } from '../Interfaces/post/IPost'; 

// Validation schema
export const PostschemaValidate = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    author: Joi.string().optional(),
    likes: Joi.number().required().default(0).min(0).max(Infinity),
    published: Joi.boolean().required(),
    image: Joi.string().optional(),
    category: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    slug: Joi.string().required()
});

// Post Schema
const postSchema = new Schema<IPost>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        author: { type: Schema.Types.String, ref: 'User', required: false }, 
        likes: { type: Number, required: true, default: 0, min: 0 },
        published: { type: Boolean, required: true, default: false },
        image: { type: String },
        category: { type: String, default: 'General' },
        tags: { type: [String], default: [] },
        slug: { type: String, required: true, unique: true },
        reviews: [{
            userId: { type: String, required: true },
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: { type: String },
            createdAt: { type: Date, default: Date.now }
        }]
    },
    { timestamps: true } // Adds createdAt and updatedAt automatically
);

postSchema.index({ title: 'text', description: 'text', author: 'text' }); // For search operation

// Add a pre-save hook to auto-generate slug from title
postSchema.pre('validate', function(this: IPost, next) {
    if ((this as any).title) {
        (this as any).slug = (this as any).title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }
    next();
});

export const Post = model<IPost>('Post', postSchema);
