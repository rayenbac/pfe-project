import { ReportService } from '../Services/report.service';
import { injectable, inject } from 'inversify';
import { ReportTYPES } from "../DI/Report/ReportTypes";
import { Request, Response, NextFunction } from 'express';
import { realtimeNotificationService } from '../Server/app';
import { User } from '../Models/user';
import { UserRole } from '../Constants/enums';

@injectable()
class ReportController {
    private service: ReportService;

    constructor(@inject(ReportTYPES.reportService) service: ReportService) {
        this.service = service;
    }

    // Create a new report (User endpoint)
    createReport = async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const reportData = {
                ...req.body,
                reporterId: req.user!._id
            };

            const report = await this.service.createReport(reportData);

            // Send real-time notification to admins about new report
            if (realtimeNotificationService) {
                try {
                    const adminUsers = await User.find({ role: UserRole.ADMIN });
                    const reporter = await User.findById(req.user!._id);
                    
                    for (const admin of adminUsers) {
                        await realtimeNotificationService.notifyNewReport(
                            admin._id.toString(),
                            {
                                reportId: report._id.toString(),
                                targetType: report.targetType,
                                targetId: report.targetId.toString(),
                                reporterName: reporter ? `${reporter.firstName} ${reporter.lastName}` : 'Unknown',
                                reason: report.reason.substring(0, 100) + (report.reason.length > 100 ? '...' : ''),
                                priority: report.priority
                            }
                        );
                    }
                } catch (notificationError) {
                    console.error('Failed to send report notification:', notificationError);
                }
            }

            res.status(201).json({
                success: true,
                message: 'Report submitted successfully',
                data: report
            });
        } catch (error) {
            console.error('Create report error:', error);
            res.status(400).json({ 
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create report' 
            });
        }
    }

    // Get all reports (Admin only)
    getReports = async (req: Request, res: Response) => {
        try {
            const { status, targetType, priority, page = 1, limit = 20 } = req.query;
            
            let reports;
            
            if (status) {
                reports = await this.service.getReportsByStatus(status as string);
            } else {
                reports = await this.service.getReports();
            }

            // Apply additional filters
            if (targetType) {
                reports = reports.filter(report => report.targetType === targetType);
            }
            
            if (priority) {
                reports = reports.filter(report => report.priority === priority);
            }

            // Pagination
            const startIndex = (Number(page) - 1) * Number(limit);
            const endIndex = startIndex + Number(limit);
            const paginatedReports = reports.slice(startIndex, endIndex);

            res.status(200).json({
                success: true,
                data: paginatedReports,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(reports.length / Number(limit)),
                    totalItems: reports.length,
                    itemsPerPage: Number(limit)
                }
            });
        } catch (error) {
            console.error('Get reports error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to fetch reports' 
            });
        }
    }

    // Get single report (Admin only)
    getReport = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const report = await this.service.getReport(id);
            
            if (report === '404') {
                return res.status(404).json({ 
                    success: false,
                    message: 'Report not found' 
                });
            }

            res.status(200).json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Get report error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to fetch report' 
            });
        }
    }

    // Update report (Admin only)
    updateReport = async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const id = req.params.id;
            const updateData = {
                ...req.body,
                reviewedBy: req.user!._id
            };

            const report = await this.service.updateReport(id, updateData);
            
            if (report === '404') {
                return res.status(404).json({ 
                    success: false,
                    message: 'Report not found' 
                });
            }

            // Send notification to reporter about status change
            if (realtimeNotificationService && typeof report === 'object') {
                try {
                    const admin = await User.findById(req.user!._id);
                    await realtimeNotificationService.notifyReportStatusChanged(
                        (report as any).reporterId.toString(),
                        {
                            reportId: report._id.toString(),
                            newStatus: (report as any).status,
                            adminName: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin',
                            adminNotes: (report as any).adminNotes || '',
                            actionTaken: (report as any).actionTaken || ''
                        }
                    );
                } catch (notificationError) {
                    console.error('Failed to send status update notification:', notificationError);
                }
            }

            res.status(200).json({
                success: true,
                message: 'Report updated successfully',
                data: report
            });
        } catch (error) {
            console.error('Update report error:', error);
            res.status(400).json({ 
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update report' 
            });
        }
    }

    // Delete report (Admin only)
    deleteReport = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const result = await this.service.deleteReport(id);
            
            res.status(200).json({
                success: true,
                message: result
            });
        } catch (error) {
            console.error('Delete report error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to delete report' 
            });
        }
    }

    // Get user's own reports
    getMyReports = async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const reporterId = req.user!._id;
            const reports = await this.service.getReportsByReporter(reporterId);

            res.status(200).json({
                success: true,
                data: reports
            });
        } catch (error) {
            console.error('Get my reports error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to fetch your reports' 
            });
        }
    }

    // Get reports for a specific target
    getTargetReports = async (req: Request, res: Response) => {
        try {
            const { targetType, targetId } = req.params;
            const reports = await this.service.getReportsByTarget(targetType, targetId);

            res.status(200).json({
                success: true,
                data: reports
            });
        } catch (error) {
            console.error('Get target reports error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to fetch target reports' 
            });
        }
    }

    // Search reports (Admin only)
    searchReports = async (req: Request, res: Response) => {
        try {
            const query = req.query.q as string;
            if (!query) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Search query required' 
                });
            }

            const reports = await this.service.searchReports(query);

            res.status(200).json({
                success: true,
                data: reports
            });
        } catch (error) {
            console.error('Search reports error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to search reports' 
            });
        }
    }

    // Get report statistics (Admin only)
    getReportStatistics = async (req: Request, res: Response) => {
        try {
            const stats = await this.service.getReportStatistics();

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get report statistics error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to fetch report statistics' 
            });
        }
    }

    // Bulk update reports (Admin only)
    bulkUpdateReports = async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const { reportIds, updateData } = req.body;
            
            if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Report IDs array is required' 
                });
            }

            const finalUpdateData = {
                ...updateData,
                reviewedBy: req.user!._id
            };

            const result = await this.service.bulkUpdateReports(reportIds, finalUpdateData);

            res.status(200).json({
                success: true,
                message: 'Reports updated successfully',
                data: result
            });
        } catch (error) {
            console.error('Bulk update reports error:', error);
            res.status(400).json({ 
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update reports' 
            });
        }
    }
}

export { ReportController };
