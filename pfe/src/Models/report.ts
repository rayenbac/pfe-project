import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { IReport } from '../Interfaces/report/IReport';

// Validation schema for the report
export const ReportSchemaValidate = Joi.object({
    reporterId: Joi.string().required(),
    targetType: Joi.string().valid('post', 'property', 'agent', 'agency').required(),
    targetId: Joi.string().required(),
    reason: Joi.string().required().min(10).max(1000),
    category: Joi.string().optional().valid(
        'spam', 'inappropriate_content', 'harassment', 'fake_listing', 
        'fraud', 'offensive_language', 'copyright_violation', 'other'
    ),
    evidence: Joi.array().items(Joi.string().uri()).optional(),
    priority: Joi.string().valid('low', 'medium', 'high').default('low')
});

// Admin update validation schema
export const AdminReportUpdateValidate = Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'resolved', 'dismissed').optional(),
    adminNotes: Joi.string().optional().max(2000),
    actionTaken: Joi.string().optional().max(500),
    priority: Joi.string().valid('low', 'medium', 'high').optional()
});

// Report Schema
const reportSchema = new Schema<IReport>(
    {
        reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        targetType: { 
            type: String, 
            enum: ['post', 'property', 'agent', 'agency'], 
            required: true 
        },
        targetId: { type: Schema.Types.ObjectId, required: true },
        reason: { 
            type: String, 
            required: true,
            minlength: 10,
            maxlength: 1000
        },
        status: { 
            type: String, 
            enum: ['pending', 'reviewed', 'resolved', 'dismissed'], 
            default: 'pending' 
        },
        adminNotes: { 
            type: String,
            maxlength: 2000
        },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        actionTaken: { 
            type: String,
            maxlength: 500
        },
        priority: { 
            type: String, 
            enum: ['low', 'medium', 'high'], 
            default: 'low' 
        },
        category: { 
            type: String,
            enum: [
                'spam', 'inappropriate_content', 'harassment', 'fake_listing', 
                'fraud', 'offensive_language', 'copyright_violation', 'other'
            ]
        },
        evidence: [{ type: String }] // URLs to evidence files
    },
    { timestamps: true }
);

// Indexes for better query performance
reportSchema.index({ reporterId: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ reviewedBy: 1 });

// Compound indexes for common queries
reportSchema.index({ targetType: 1, status: 1 });
reportSchema.index({ reporterId: 1, targetType: 1 });
reportSchema.index({ status: 1, priority: 1, createdAt: -1 });

export const Report = model<IReport>('Report', reportSchema);
