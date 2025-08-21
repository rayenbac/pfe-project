import { injectable } from 'inversify';
import { Server } from 'socket.io';
import { Notification } from '../Models/notification';
import { INotification, NotificationType } from '../Interfaces/notification/INotification';
import { User } from '../Models/user';
import { Property } from '../Models/property';
import { Types } from 'mongoose';
import logger from '../Config/logger.config';
import "reflect-metadata";

export interface NotificationPayload {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: 'property' | 'transaction' | 'message' | 'payment' | 'viewing' | 'booking' | 'post' | 'review' | 'agency' | 'agent';
    priority?: 'low' | 'medium' | 'high';
    data?: any; // Additional data for frontend
}

@injectable()
export class RealtimeNotificationService {
    private io: Server | null = null;

    // Set the Socket.IO instance
    setSocketIO(io: Server) {
        this.io = io;
    }

    // Create and emit a real-time notification
    async createAndEmitNotification(payload: NotificationPayload): Promise<INotification | null> {
        try {
            console.log('🔔 createAndEmitNotification called with payload:', JSON.stringify(payload, null, 2));
            
            // Create notification in database
            const notificationData = {
                userId: new Types.ObjectId(payload.userId),
                type: payload.type,
                title: payload.title,
                message: payload.message,
                relatedId: payload.relatedId, // Don't convert to ObjectId for slugs
                relatedType: payload.relatedType,
                priority: payload.priority || 'low'
            };
            
            console.log('🔔 About to save notification to DB:', JSON.stringify(notificationData, null, 2));
            
            const notification = await Notification.create(notificationData);
            
            console.log('🔔 Notification saved to DB:', JSON.stringify(notification.toObject(), null, 2));

            // Populate notification for response (only populate userId, avoid relatedId for now)
            const populatedNotification = await Notification.findById(notification._id)
                .populate('userId', 'firstName lastName email');

            console.log('🔔 Populated notification:', JSON.stringify(populatedNotification?.toObject(), null, 2));

            // Emit real-time notification via Socket.IO
            if (this.io) {
                const emitData = {
                    notification: populatedNotification,
                    data: payload.data
                };
                console.log('🔔 Emitting notification via Socket.IO:', JSON.stringify(emitData, null, 2));
                
                this.io.to(payload.userId).emit('new_notification', emitData);

                logger.info(`Real-time notification sent to user ${payload.userId}: ${payload.type}`);
            }

            return populatedNotification;
        } catch (error) {
            logger.error('Error creating and emitting notification:', error);
            return null;
        }
    }

    // Notification triggers for different events

    // 1. Booking notifications
    async notifyNewBooking(propertyId: string, bookingId: string, guestUserId: string): Promise<void> {
        try {
            const property = await Property.findById(propertyId).populate('owner', 'firstName lastName');
            if (property && property.owner) {
                await this.createAndEmitNotification({
                    userId: property.owner._id.toString(),
                    type: 'new_booking',
                    title: 'New Booking Request',
                    message: `You have a new booking request for your property "${property.title}"`,
                    relatedId: bookingId,
                    relatedType: 'booking',
                    priority: 'high',
                    data: {
                        propertyTitle: property.title,
                        propertyId: propertyId,
                        bookingId: bookingId
                    }
                });
            }
        } catch (error) {
            logger.error('Error sending booking notification:', error);
        }
    }

    async notifyBookingConfirmed(bookingId: string, guestUserId: string): Promise<void> {
        try {
            await this.createAndEmitNotification({
                userId: guestUserId,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                message: 'Your booking has been confirmed!',
                relatedId: bookingId,
                relatedType: 'booking',
                priority: 'high',
                data: {
                    bookingId: bookingId
                }
            });
        } catch (error) {
            logger.error('Error sending booking confirmation notification:', error);
        }
    }

    // 2. Messaging notifications
    async notifyNewMessage(senderId: string, recipientId: string, chatId: string, messageContent: string): Promise<void> {
        try {
            const sender = await User.findById(senderId);
            if (sender) {
                await this.createAndEmitNotification({
                    userId: recipientId,
                    type: 'new_message',
                    title: 'New Message',
                    message: `${sender.firstName} ${sender.lastName} sent you a message`,
                    relatedId: chatId,
                    relatedType: 'message',
                    priority: 'medium',
                    data: {
                        senderId: senderId,
                        senderName: `${sender.firstName} ${sender.lastName}`,
                        chatId: chatId,
                        messagePreview: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : '')
                    }
                });
            }
        } catch (error) {
            logger.error('Error sending message notification:', error);
        }
    }

    // 3. Favorite property update notifications
    async notifyFavoritePropertyUpdate(propertyId: string, updateType: string): Promise<void> {
        try {
            // Find all users who have this property as favorite
            const favorites = await this.findUsersWithPropertyAsFavorite(propertyId);
            const property = await Property.findById(propertyId);

            if (property && favorites.length > 0) {
                const notifications = favorites.map(userId => 
                    this.createAndEmitNotification({
                        userId: userId,
                        type: 'favorite_property_updated',
                        title: 'Favorite Property Updated',
                        message: `One of your favorite properties "${property.title}" has been updated`,
                        relatedId: propertyId,
                        relatedType: 'property',
                        priority: 'low',
                        data: {
                            propertyTitle: property.title,
                            propertyId: propertyId,
                            updateType: updateType
                        }
                    })
                );

                await Promise.all(notifications);
            }
        } catch (error) {
            logger.error('Error sending favorite property update notifications:', error);
        }
    }

    // 4. Payment confirmation notifications
    async notifyPaymentConfirmed(userId: string, paymentId: string, amount: number): Promise<void> {
        try {
            await this.createAndEmitNotification({
                userId: userId,
                type: 'payment_confirmed',
                title: 'Payment Confirmed',
                message: `Your payment of $${amount} has been confirmed`,
                relatedId: paymentId,
                relatedType: 'payment',
                priority: 'high',
                data: {
                    paymentId: paymentId,
                    amount: amount
                }
            });
        } catch (error) {
            logger.error('Error sending payment confirmation notification:', error);
        }
    }

    // 5. Review and rating notifications
    async notifyPropertyReviewed(propertyId: string, reviewId: string, reviewerName: string, rating: number): Promise<void> {
        try {
            const property = await Property.findById(propertyId).populate('owner', 'firstName lastName');
            if (property && property.owner) {
                await this.createAndEmitNotification({
                    userId: property.owner._id.toString(),
                    type: 'property_reviewed',
                    title: 'New Review Received',
                    message: `${reviewerName} left a ${rating}-star review for your property "${property.title}"`,
                    relatedId: reviewId,
                    relatedType: 'review',
                    priority: 'medium',
                    data: {
                        propertyTitle: property.title,
                        propertyId: propertyId,
                        reviewId: reviewId,
                        reviewerName: reviewerName,
                        rating: rating
                    }
                });
            }
        } catch (error) {
            logger.error('Error sending review notification:', error);
        }
    }

    // 6. Post review notifications
    async notifyPostReviewed(postId: string, reviewId: string, reviewerName: string, rating: number): Promise<void> {
        try {
            console.log('notifyPostReviewed called with:', { postId, reviewId, reviewerName, rating });
            
            // Import Post model if not already imported
            const { Post } = await import('../Models/post');
            const post = await Post.findById(postId).populate('author', 'firstName lastName');
            console.log('Found post:', post);
            
            if (post && post.author) {
                // After populate, author becomes an object, but TypeScript thinks it's still a string
                // So we need to cast it or handle it differently
                const authorId = typeof post.author === 'string' ? post.author : (post.author as any)._id?.toString();
                console.log('Post author ID:', authorId);
                console.log('🔍 Debug post object slug:', post.slug);
                console.log('🔍 Debug post object keys:', Object.keys(post));
                console.log('🔍 Will use as relatedId:', post.slug || postId);
                
                if (authorId) {
                    console.log('Creating notification for author:', authorId);
                    const slugToUse = post.slug || postId;
                    console.log('🔍 Final slug/ID to use:', slugToUse);
                    const notificationData: NotificationPayload = {
                        userId: authorId,
                        type: 'post_reviewed' as NotificationType,
                        title: 'New Review on Your Post',
                        message: `${reviewerName} left a ${rating}-star review on your post "${post.title}"`,
                        relatedId: slugToUse, // Use slug as relatedId, fallback to postId if slug is undefined
                        relatedType: 'post',
                        priority: 'medium' as 'low' | 'medium' | 'high',
                        data: {
                            postTitle: post.title,
                            postId: postId,
                            postSlug: post.slug, // Include slug for navigation
                            reviewId: reviewId,
                            reviewerName: reviewerName,
                            rating: rating
                        }
                    };
                    console.log('🔔 Creating notification with data:', JSON.stringify(notificationData, null, 2));
                    await this.createAndEmitNotification(notificationData);
                    console.log('Notification created and emitted');
                }
            } else {
                console.log('Post not found or no author');
            }
        } catch (error) {
            logger.error('Error sending post review notification:', error);
        }
    }

    // 6. Post comment notifications
    async notifyPostCommented(postId: string, commentId: string, commenterName: string, postOwnerId: string): Promise<void> {
        try {
            await this.createAndEmitNotification({
                userId: postOwnerId,
                type: 'post_commented',
                title: 'New Comment on Your Post',
                message: `${commenterName} commented on your post`,
                relatedId: commentId,
                relatedType: 'post',
                priority: 'low',
                data: {
                    postId: postId,
                    commentId: commentId,
                    commenterName: commenterName
                }
            });
        } catch (error) {
            logger.error('Error sending post comment notification:', error);
        }
    }

    // 7. Admin notifications
    async notifyAdminNewProperty(propertyId: string, ownerName: string): Promise<void> {
        try {
            const adminUsers = await this.findAdminUsers();
            const property = await Property.findById(propertyId);

            if (property && adminUsers.length > 0) {
                const notifications = adminUsers.map(adminId => 
                    this.createAndEmitNotification({
                        userId: adminId,
                        type: 'admin_new_property',
                        title: 'New Property Added',
                        message: `${ownerName} added a new property: "${property.title}"`,
                        relatedId: propertyId,
                        relatedType: 'property',
                        priority: 'low',
                        data: {
                            propertyTitle: property.title,
                            propertyId: propertyId,
                            ownerName: ownerName
                        }
                    })
                );

                await Promise.all(notifications);
            }
        } catch (error) {
            logger.error('Error sending admin new property notification:', error);
        }
    }

    async notifyAdminPropertyUpdated(propertyId: string, ownerName: string): Promise<void> {
        try {
            const adminUsers = await this.findAdminUsers();
            const property = await Property.findById(propertyId);

            if (property && adminUsers.length > 0) {
                const notifications = adminUsers.map(adminId => 
                    this.createAndEmitNotification({
                        userId: adminId,
                        type: 'admin_property_updated',
                        title: 'Property Updated',
                        message: `${ownerName} updated property: "${property.title}"`,
                        relatedId: propertyId,
                        relatedType: 'property',
                        priority: 'low',
                        data: {
                            propertyTitle: property.title,
                            propertyId: propertyId,
                            ownerName: ownerName
                        }
                    })
                );

                await Promise.all(notifications);
            }
        } catch (error) {
            logger.error('Error sending admin property update notification:', error);
        }
    }

    async notifyAdminReportReceived(reportType: string, reportedItemId: string, reporterName: string): Promise<void> {
        try {
            const adminUsers = await this.findAdminUsers();

            if (adminUsers.length > 0) {
                const notifications = adminUsers.map(adminId => 
                    this.createAndEmitNotification({
                        userId: adminId,
                        type: 'admin_report_received',
                        title: 'New Report Received',
                        message: `${reporterName} reported a ${reportType}`,
                        relatedId: reportedItemId,
                        relatedType: reportType as any,
                        priority: 'high',
                        data: {
                            reportType: reportType,
                            reportedItemId: reportedItemId,
                            reporterName: reporterName
                        }
                    })
                );

                await Promise.all(notifications);
            }
        } catch (error) {
            logger.error('Error sending admin report notification:', error);
        }
    }

    // Report-related notification methods
    async notifyNewReport(adminId: string, reportData: {
        reportId: string;
        targetType: string;
        targetId: string;
        reporterName: string;
        reason: string;
        priority: string;
    }): Promise<void> {
        try {
            await this.createAndEmitNotification({
                userId: adminId,
                type: 'admin_new_report' as NotificationType,
                title: `New ${reportData.targetType} report`,
                message: `${reportData.reporterName} reported a ${reportData.targetType}: ${reportData.reason}`,
                relatedId: reportData.reportId,
                relatedType: 'agency', // Using agency as placeholder for reports
                priority: reportData.priority as 'low' | 'medium' | 'high',
                data: {
                    reportId: reportData.reportId,
                    targetType: reportData.targetType,
                    targetId: reportData.targetId,
                    reporterName: reportData.reporterName,
                    priority: reportData.priority
                }
            });
        } catch (error) {
            logger.error('Error sending new report notification:', error);
        }
    }

    async notifyReportStatusChanged(reporterId: string, reportData: {
        reportId: string;
        newStatus: string;
        adminName: string;
        adminNotes?: string;
        actionTaken?: string;
    }): Promise<void> {
        try {
            let message = `Your report has been ${reportData.newStatus} by ${reportData.adminName}`;
            if (reportData.actionTaken) {
                message += `. Action taken: ${reportData.actionTaken}`;
            }

            await this.createAndEmitNotification({
                userId: reporterId,
                type: 'report_status_update' as NotificationType,
                title: `Report ${reportData.newStatus}`,
                message: message,
                relatedId: reportData.reportId,
                relatedType: 'agency', // Using agency as placeholder for reports
                priority: 'medium',
                data: {
                    reportId: reportData.reportId,
                    newStatus: reportData.newStatus,
                    adminName: reportData.adminName,
                    adminNotes: reportData.adminNotes,
                    actionTaken: reportData.actionTaken
                }
            });
        } catch (error) {
            logger.error('Error sending report status change notification:', error);
        }
    }

    async notifyUserBlocked(userId: string, blockData: {
        reason: string;
        adminName: string;
    }): Promise<void> {
        try {
            await this.createAndEmitNotification({
                userId: userId,
                type: 'account_blocked' as NotificationType,
                title: 'Account Blocked',
                message: `Your account has been blocked by ${blockData.adminName}. Reason: ${blockData.reason}`,
                priority: 'high',
                data: {
                    reason: blockData.reason,
                    adminName: blockData.adminName,
                    blockedAt: new Date()
                }
            });
        } catch (error) {
            logger.error('Error sending user blocked notification:', error);
        }
    }

    async notifyUserUnblocked(userId: string, adminName: string): Promise<void> {
        try {
            await this.createAndEmitNotification({
                userId: userId,
                type: 'account_unblocked' as NotificationType,
                title: 'Account Unblocked',
                message: `Your account has been unblocked by ${adminName}. You can now access all features.`,
                priority: 'medium',
                data: {
                    adminName: adminName,
                    unblockedAt: new Date()
                }
            });
        } catch (error) {
            logger.error('Error sending user unblocked notification:', error);
        }
    }

    // Helper methods
    private async findUsersWithPropertyAsFavorite(propertyId: string): Promise<string[]> {
        try {
            // This would depend on your favorite model structure
            // Assuming you have a Favorite model
            const { Favorite } = await import('../Models/favorite');
            const favorites = await Favorite.find({ 
                $or: [
                    { entityType: 'property', entityId: propertyId },
                    { properties: propertyId } // For backward compatibility
                ]
            });
            return favorites.map(fav => fav.userId.toString());
        } catch (error) {
            logger.error('Error finding users with property as favorite:', error);
            return [];
        }
    }

    private async findAdminUsers(): Promise<string[]> {
        try {
            const adminUsers = await User.find({ role: 'admin' });
            return adminUsers.map(user => user._id.toString());
        } catch (error) {
            logger.error('Error finding admin users:', error);
            return [];
        }
    }

    // Additional utility methods
    async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
        try {
            await Notification.findOneAndUpdate(
                { _id: notificationId, userId: userId },
                { isRead: true }
            );

            if (this.io) {
                this.io.to(userId).emit('notification_read', { notificationId });
            }
        } catch (error) {
            logger.error('Error marking notification as read:', error);
        }
    }

    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        try {
            await Notification.findOneAndDelete({
                _id: notificationId,
                userId: userId
            });

            if (this.io) {
                this.io.to(userId).emit('notification_deleted', { notificationId });
            }
        } catch (error) {
            logger.error('Error deleting notification:', error);
        }
    }

    async deleteAllNotifications(userId: string): Promise<void> {
        try {
            await Notification.deleteMany({ userId: userId });

            if (this.io) {
                this.io.to(userId).emit('all_notifications_deleted');
            }
        } catch (error) {
            logger.error('Error deleting all notifications:', error);
        }
    }
}
