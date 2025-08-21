import { injectable } from 'inversify';
import { Report, ReportSchemaValidate, AdminReportUpdateValidate } from '../Models/report';
import { User } from '../Models/user';
import { Post } from '../Models/post';
import { Property } from '../Models/property';
import { Agency } from '../Models/agency';
import { IReport, IReportRepository } from '../Interfaces/report/IReport';
import { logger } from '../Config/logger.config';
import { Types } from 'mongoose';

@injectable()
class ReportService implements IReportRepository {
    constructor() {}

    async createReport(data: any): Promise<IReport> {
        try {
            const { error, value } = ReportSchemaValidate.validate(data);
            if (error) {
                throw new Error(error.message);
            }

            // Verify target exists
            const targetExists = await this.verifyTargetExists(value.targetType, value.targetId);
            if (!targetExists) {
                throw new Error(`${value.targetType} not found`);
            }

            // Check if user already reported this target
            const existingReport = await Report.findOne({
                reporterId: value.reporterId,
                targetType: value.targetType,
                targetId: value.targetId
            });

            if (existingReport) {
                throw new Error('You have already reported this item');
            }

            // Determine priority based on category
            if (!value.priority) {
                value.priority = this.calculatePriority(value.category, value.reason);
            }

            const report = await Report.create(value);
            
            // Increment report count for the target if it's a user/agent
            if (value.targetType === 'agent') {
                await User.findByIdAndUpdate(value.targetId, { 
                    $inc: { reportCount: 1 } 
                });
            }

            return report;
        } catch (error) {
            logger.error('Create report error:', error);
            throw error;
        }
    }

    async getReports(): Promise<IReport[]> {
        try {
            const reports = await Report.find()
                .populate('reporterId', 'firstName lastName email')
                .populate('reviewedBy', 'firstName lastName')
                .sort({ createdAt: -1 });
            return reports;
        } catch (error) {
            logger.error('Get reports error:', error);
            throw error;
        }
    }

    async getReport(id: string): Promise<IReport | string> {
        try {
            const report = await Report.findById(id)
                .populate('reporterId', 'firstName lastName email profileImage')
                .populate('reviewedBy', 'firstName lastName');
            
            if (!report) {
                return '404';
            }

            return report;
        } catch (error) {
            logger.error('Get report error:', error);
            return '404';
        }
    }

    async updateReport(id: string, data: any): Promise<IReport | string> {
        try {
            const { error, value } = AdminReportUpdateValidate.validate(data);
            if (error) {
                throw new Error(error.message);
            }

            // Set review timestamp if status is being changed to reviewed/resolved
            if (value.status === 'reviewed' || value.status === 'resolved') {
                value.reviewedAt = new Date();
            }

            const report = await Report.findByIdAndUpdate(id, value, { new: true })
                .populate('reporterId', 'firstName lastName email')
                .populate('reviewedBy', 'firstName lastName');

            if (!report) {
                return '404';
            }

            return report;
        } catch (error) {
            logger.error('Update report error:', error);
            throw error;
        }
    }

    async deleteReport(id: string): Promise<string> {
        try {
            const report = await Report.findByIdAndDelete(id);
            if (!report) {
                return 'Report not found';
            }
            return 'Report deleted successfully';
        } catch (error) {
            logger.error('Delete report error:', error);
            throw error;
        }
    }

    async getReportsByTarget(targetType: string, targetId: string): Promise<IReport[]> {
        try {
            const reports = await Report.find({ targetType, targetId })
                .populate('reporterId', 'firstName lastName email')
                .sort({ createdAt: -1 });
            return reports;
        } catch (error) {
            logger.error('Get reports by target error:', error);
            throw error;
        }
    }

    async getReportsByReporter(reporterId: string): Promise<IReport[]> {
        try {
            const reports = await Report.find({ reporterId })
                .populate('reporterId', 'firstName lastName email')
                .sort({ createdAt: -1 });
            return reports;
        } catch (error) {
            logger.error('Get reports by reporter error:', error);
            throw error;
        }
    }

    async getReportsByStatus(status: string): Promise<IReport[]> {
        try {
            const reports = await Report.find({ status })
                .populate('reporterId', 'firstName lastName email')
                .populate('reviewedBy', 'firstName lastName')
                .sort({ priority: -1, createdAt: -1 });
            return reports;
        } catch (error) {
            logger.error('Get reports by status error:', error);
            throw error;
        }
    }

    async searchReports(query: string): Promise<IReport[]> {
        try {
            const reports = await Report.find({
                $or: [
                    { reason: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } },
                    { adminNotes: { $regex: query, $options: 'i' } },
                    { actionTaken: { $regex: query, $options: 'i' } }
                ]
            })
            .populate('reporterId', 'firstName lastName email')
            .populate('reviewedBy', 'firstName lastName')
            .sort({ createdAt: -1 });
            return reports;
        } catch (error) {
            logger.error('Search reports error:', error);
            throw error;
        }
    }

    // Helper methods
    private async verifyTargetExists(targetType: string, targetId: string): Promise<boolean> {
        try {
            let target;
            switch (targetType) {
                case 'post':
                    target = await Post.findById(targetId);
                    break;
                case 'property':
                    target = await Property.findById(targetId);
                    break;
                case 'agent':
                    target = await User.findById(targetId);
                    break;
                case 'agency':
                    target = await Agency.findById(targetId);
                    break;
                default:
                    return false;
            }

            return !!target;
        } catch (error) {
            return false;
        }
    }

    private calculatePriority(category?: string, reason?: string): 'low' | 'medium' | 'high' {
        const highPriorityCategories = ['harassment', 'fraud', 'fake_listing'];
        const mediumPriorityCategories = ['inappropriate_content', 'offensive_language'];
        
        if (category && highPriorityCategories.includes(category)) {
            return 'high';
        }
        
        if (category && mediumPriorityCategories.includes(category)) {
            return 'medium';
        }

        // Check reason for urgent keywords
        const urgentKeywords = ['threat', 'dangerous', 'illegal', 'scam', 'steal'];
        if (reason && urgentKeywords.some(keyword => 
            reason.toLowerCase().includes(keyword))) {
            return 'high';
        }

        return 'low';
    }

    // Admin specific methods
    async getReportStatistics(): Promise<any> {
        try {
            const stats = await Report.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const totalReports = await Report.countDocuments();
            const pendingReports = await Report.countDocuments({ status: 'pending' });
            const resolvedReports = await Report.countDocuments({ status: 'resolved' });
            const highPriorityReports = await Report.countDocuments({ 
                priority: 'high', 
                status: 'pending' 
            });

            const categoryStats = await Report.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            return {
                totalReports,
                pendingReports,
                resolvedReports,
                highPriorityReports,
                statusBreakdown: stats,
                categoryBreakdown: categoryStats
            };
        } catch (error) {
            logger.error('Get report statistics error:', error);
            throw error;
        }
    }

    async bulkUpdateReports(reportIds: string[], updateData: any): Promise<any> {
        try {
            const { error, value } = AdminReportUpdateValidate.validate(updateData);
            if (error) {
                throw new Error(error.message);
            }

            if (value.status === 'reviewed' || value.status === 'resolved') {
                value.reviewedAt = new Date();
            }

            const result = await Report.updateMany(
                { _id: { $in: reportIds } },
                value
            );

            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            logger.error('Bulk update reports error:', error);
            throw error;
        }
    }
}

export { ReportService };
