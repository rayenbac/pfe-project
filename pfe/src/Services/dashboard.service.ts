import { injectable } from 'inversify';
import { Property } from '../Models/property';
import { User } from '../Models/user';
import { Agency } from '../Models/agency';
import { Post } from '../Models/post';
import { Review } from '../Models/review';
import { Report } from '../Models/report';
import { Booking } from '../Models/booking';
import { logger } from '../Config/logger.config';

interface Activity {
    type: string;
    icon: string;
    title: string;
    agent?: string;
    reporter?: string;
    time: Date;
    link: string;
}

@injectable()
export class DashboardService {
    
    async getAdminDashboardStatistics(): Promise<any> {
        try {
            // Get overall statistics
            const [
                totalProperties,
                totalUsers,
                totalAgents,
                totalAgencies,
                totalPosts,
                totalReviews,
                totalReports,
                totalBookings,
                pendingPosts,
                recentActivities
            ] = await Promise.all([
                Property.countDocuments(),
                User.countDocuments({ role: { $ne: 'admin' } }),
                User.countDocuments({ role: 'agent' }),
                Agency.countDocuments(),
                Post.countDocuments(),
                Review.countDocuments(),
                Report.countDocuments(),
                Booking.countDocuments(),
                Post.countDocuments({ published: false }),
                this.getRecentActivities()
            ]);

            // Property statistics by type
            const propertyTypes = await Property.aggregate([
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Property statistics by status
            const propertyStatus = await Property.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Monthly registrations (last 12 months)
            const monthlyUsers = await User.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // Top agents by properties
            const topAgents = await Property.aggregate([
                {
                    $group: {
                        _id: '$listedBy',
                        propertyCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'agent'
                    }
                },
                { $unwind: '$agent' },
                {
                    $project: {
                        agentName: { $concat: ['$agent.firstName', ' ', '$agent.lastName'] },
                        propertyCount: 1,
                        agentId: '$_id'
                    }
                },
                { $sort: { propertyCount: -1 } },
                { $limit: 5 }
            ]);

            // Revenue/Transaction statistics (if available)
            const monthlyRevenue = await Booking.aggregate([
                {
                    $match: {
                        status: 'confirmed',
                        createdAt: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 },
                        revenue: { $sum: '$totalAmount' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            return {
                overview: {
                    totalProperties,
                    totalUsers,
                    totalAgents,
                    totalAgencies,
                    totalPosts,
                    totalReviews,
                    totalReports,
                    totalBookings,
                    pendingPosts
                },
                charts: {
                    propertyTypes,
                    propertyStatus,
                    monthlyUsers,
                    monthlyRevenue,
                    topAgents
                },
                recentActivities
            };
        } catch (error) {
            logger.error('Dashboard statistics error:', error);
            throw error;
        }
    }

    private async getRecentActivities(): Promise<Activity[]> {
        try {
            const activities: Activity[] = [];

            // Recent properties
            const recentProperties = await Property.find()
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('listedBy', 'firstName lastName');

            recentProperties.forEach(property => {
                activities.push({
                    type: 'property',
                    icon: 'flaticon-home',
                    title: `New property listed: ${property.title}`,
                    agent: property.listedBy ? `${(property.listedBy as any).firstName} ${(property.listedBy as any).lastName}` : 'Unknown',
                    time: property.createdAt,
                    link: `/properties/${property._id}`
                });
            });

            // Recent user registrations
            const recentUsers = await User.find({ role: { $ne: 'admin' } })
                .sort({ createdAt: -1 })
                .limit(3)
                .select('firstName lastName role createdAt');

            recentUsers.forEach(user => {
                activities.push({
                    type: 'user',
                    icon: 'flaticon-user',
                    title: `New ${user.role} registered: ${user.firstName} ${user.lastName}`,
                    time: user.createdAt,
                    link: `/admin/users/${user._id}`
                });
            });

            // Recent reports
            const recentReports = await Report.find()
                .sort({ createdAt: -1 })
                .limit(2)
                .populate('reporterId', 'firstName lastName');

            recentReports.forEach(report => {
                activities.push({
                    type: 'report',
                    icon: 'flaticon-warning',
                    title: `New report: ${report.category} on ${report.targetType}`,
                    reporter: report.reporterId ? `${(report.reporterId as any).firstName} ${(report.reporterId as any).lastName}` : 'Anonymous',
                    time: report.createdAt,
                    link: `/admin/reports/${report._id}`
                });
            });

            // Sort by time and return latest
            return activities
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                .slice(0, 6);

        } catch (error) {
            logger.error('Recent activities error:', error);
            return [];
        }
    }

    async getPropertyAnalytics(): Promise<any> {
        try {
            const propertyAnalytics = await Property.aggregate([
                {
                    $facet: {
                        byCity: [
                            {
                                $group: {
                                    _id: '$address.city',
                                    count: { $sum: 1 },
                                    avgPrice: { $avg: '$pricing.price' }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ],
                        byPriceRange: [
                            {
                                $bucket: {
                                    groupBy: '$pricing.price',
                                    boundaries: [0, 100000, 200000, 500000, 1000000, 2000000, 10000000],
                                    default: 'Other',
                                    output: {
                                        count: { $sum: 1 },
                                        properties: { $push: '$title' }
                                    }
                                }
                            }
                        ],
                        byBedroomCount: [
                            {
                                $group: {
                                    _id: '$bedrooms',
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { '_id': 1 } }
                        ]
                    }
                }
            ]);

            return propertyAnalytics[0];
        } catch (error) {
            logger.error('Property analytics error:', error);
            throw error;
        }
    }
}
