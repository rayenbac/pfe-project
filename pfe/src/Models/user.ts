import { Schema, model } from 'mongoose';
import Joi from 'joi';
import { IUser, ISocialMedia } from '../Interfaces/user/IUser';
import { UserRole } from '../Constants/enums';

// Social Media validation schema
const SocialMediaSchemaValidate = Joi.object({
    website: Joi.string().uri().optional(),
    facebook: Joi.string().uri().optional(),
    twitter: Joi.string().uri().optional(),
    instagram: Joi.string().uri().optional(),
    linkedin: Joi.string().uri().optional(),
    youtube: Joi.string().uri().optional(),
    pinterest: Joi.string().uri().optional()
});

// Validation schema using Joi
export const UserSchemaValidate = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().required(),
    role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.USER),
    address: Joi.string().optional(),
    description: Joi.string().optional(), // Agent description/bio
    profileImage: Joi.string().uri().optional(),
    verificationImage: Joi.string().uri().optional(),
    isVerified: Joi.boolean().default(false),
    agentType: Joi.string().valid('particular', 'professional').optional(),
    agencyId: Joi.string().when('role', {
        is: UserRole.AGENT,
        then: Joi.string().optional(),
        otherwise: Joi.forbidden()
    }),
    socialMedia: SocialMediaSchemaValidate.optional(),
    website: Joi.string().uri().optional(),
    posts: Joi.array().items(Joi.string().valid('particular', 'professional').optional()),
    isBlocked: Joi.boolean().default(false),
    blockReason: Joi.string().optional(),
    blockedBy: Joi.string().optional(),
    blockedAt: Joi.date().optional(),
    reportCount: Joi.number().default(0)
});

// Social Media Schema
const SocialMediaSchema = new Schema<ISocialMedia>({
    website: { type: String },
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
    youtube: { type: String },
    pinterest: { type: String }
}, { _id: false });

// User Schema
const UserSchema = new Schema<IUser & { resetPasswordToken?: string, resetPasswordExpires?: Date }>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String, required: true, unique: true },
        role: { 
            type: String, 
            enum: Object.values(UserRole),
            required: true,
            default: UserRole.USER
        },
        address: { type: String },
        description: { type: String }, // Agent description/bio
        profileImage: { type: String },
        verificationImage: { type: String },
        isVerified: { type: Boolean, default: false },
        agentType: { 
            type: String,
            enum: ['particular', 'professional'],
            required: false
        },
        agencyId: { 
            type: Schema.Types.ObjectId,
            ref: 'Agency',
            required: false
        },
        // Electronic signature for agents
        digitalSignature: {
            signatureImage: { type: String }, // Base64 encoded signature image
            signatureFont: { type: String }, // Font style for typed signatures
            signatureText: { type: String }, // Typed signature text
            signatureType: { 
                type: String, 
                enum: ['drawn', 'typed', 'uploaded'],
                required: false 
            },
            uploadedAt: { type: Date },
            isActive: { type: Boolean, default: true }
        },
        socialMedia: { type: SocialMediaSchema },
        website: { type: String },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
        posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
        
        // User blocking fields
        isBlocked: { type: Boolean, default: false },
        blockReason: { type: String },
        blockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        blockedAt: { type: Date },
        reportCount: { type: Number, default: 0 } // Track how many times user has been reported
    },
    { timestamps: true }
);

export const User = model<IUser & { resetPasswordToken?: string, resetPasswordExpires?: Date }>('User', UserSchema);