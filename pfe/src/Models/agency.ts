import mongoose from 'mongoose';
import Joi from 'joi';
import { IAgency } from '../Interfaces/agency/IAgency';

// Validation schema using Joi
export const AgencySchemaValidate = Joi.object({
    name: Joi.string().min(3).required(),
    description: Joi.string().required(),
    logo: Joi.alternatives().try(
        Joi.string().pattern(/^https?:\/\/.+/),
        Joi.string().pattern(/^\/uploads\/agencies\/.+/),
        Joi.string().allow(''),
        Joi.any() // Allow file uploads
    ),
    address: Joi.string().required(),
    phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri().allow(''),
    licenseNumber: Joi.string().required(),
    foundedYear: Joi.number().min(1900).max(new Date().getFullYear()).required(),
    ownerId: Joi.string().required(),
    isVerified: Joi.boolean().default(false),
    socialMedia: Joi.object({
        facebook: Joi.string().uri().optional(),
        twitter: Joi.string().uri().optional(),
        instagram: Joi.string().uri().optional(),
        linkedin: Joi.string().uri().optional()
    }).optional(),
    workingHours: Joi.object({
        monday: Joi.string().optional(),
        tuesday: Joi.string().optional(),
        wednesday: Joi.string().optional(),
        thursday: Joi.string().optional(),
        friday: Joi.string().optional(),
        saturday: Joi.string().optional(),
        sunday: Joi.string().optional()
    }).optional(),
    services: Joi.array().items(Joi.string()).optional(),
    specializations: Joi.array().items(Joi.string()).optional(),
    rating: Joi.number().min(0).max(5).default(0),
    totalReviews: Joi.number().min(0).default(0),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active')
});

// Agency Schema
const AgencySchema = new mongoose.Schema<IAgency>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        default: null
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function(v: string) {
                return /^\+[1-9]\d{1,14}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: function(v: string) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    website: {
        type: String,
        validate: {
            validator: function(v: string) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    },
    licenseNumber: {
        type: String,
        required: true
    },
    foundedYear: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear()
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isVerified: { type: Boolean, default: false },
    socialMedia: {
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String
    },
    workingHours: {
        monday: String,
        tuesday: String,
        wednesday: String,
        thursday: String,
        friday: String,
        saturday: String,
        sunday: String
    },
    services: [{ type: String }],
    specializations: [{ type: String }],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Update timestamps on save
AgencySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export const Agency = mongoose.model<IAgency>('Agency', AgencySchema); 