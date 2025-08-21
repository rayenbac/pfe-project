import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { DashboardService } from '../Services/dashboard.service';
import { logger } from '../Config/logger.config';

@injectable()
export class DashboardController {
    constructor(
        @inject('DashboardService') private dashboardService: DashboardService
    ) {}

    // Get admin dashboard statistics
    getAdminStatistics = async (req: Request, res: Response) => {
        try {
            const statistics = await this.dashboardService.getAdminDashboardStatistics();

            res.status(200).json({
                success: true,
                data: statistics,
                message: 'Dashboard statistics retrieved successfully'
            });
        } catch (error) {
            logger.error('Dashboard statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard statistics',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // Get property analytics
    getPropertyAnalytics = async (req: Request, res: Response) => {
        try {
            const analytics = await this.dashboardService.getPropertyAnalytics();

            res.status(200).json({
                success: true,
                data: analytics,
                message: 'Property analytics retrieved successfully'
            });
        } catch (error) {
            logger.error('Property analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch property analytics',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // Get quick stats for dashboard cards
    getQuickStats = async (req: Request, res: Response) => {
        try {
            const statistics = await this.dashboardService.getAdminDashboardStatistics();
            
            res.status(200).json({
                success: true,
                data: {
                    properties: statistics.overview.totalProperties,
                    users: statistics.overview.totalUsers,
                    agents: statistics.overview.totalAgents,
                    agencies: statistics.overview.totalAgencies,
                    posts: statistics.overview.totalPosts,
                    reviews: statistics.overview.totalReviews,
                    reports: statistics.overview.totalReports,
                    bookings: statistics.overview.totalBookings,
                    pendingPosts: statistics.overview.pendingPosts
                }
            });
        } catch (error) {
            logger.error('Quick stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch quick statistics'
            });
        }
    };
}
