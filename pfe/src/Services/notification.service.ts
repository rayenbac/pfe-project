import { injectable } from 'inversify';
import { Notification } from '../Models/notification';
import { INotification, NotificationType } from '../Interfaces/notification/INotification';
import "reflect-metadata";

@injectable()
class NotificationService {
    // Get all notifications for a user
    async getUserNotifications(userId: string) {
        try {
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 });
            return notifications;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Get unread notifications for a user
    async getUnreadNotifications(userId: string) {
        try {
            const notifications = await Notification.find({ 
                userId,
                isRead: false 
            }).sort({ createdAt: -1 });
            return notifications;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Create a new notification
    async createNotification(data: Omit<INotification, '_id'>) {
        try {
            const notification = await Notification.create(data);
            return notification;
        } catch (error) {
            console.log(error);
            throw new Error('Error creating notification');
        }
    }

    // Mark notification as read
    async markAsRead(id: string) {
        try {
            const notification = await Notification.findByIdAndUpdate(
                id,
                { isRead: true },
                { new: true }
            );
            return notification;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Mark all notifications as read for a user
    async markAllAsRead(userId: string) {
        try {
            await Notification.updateMany(
                { userId, isRead: false },
                { isRead: true }
            );
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // Delete a notification
    async deleteNotification(id: string) {
        try {
            await Notification.findByIdAndDelete(id);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // Delete all notifications for a user
    async deleteAllNotifications(userId: string) {
        try {
            await Notification.deleteMany({ userId });
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // Schedule a notification
    async scheduleNotification(data: Omit<INotification, '_id'>) {
        try {
            if (!data.scheduledFor) {
                throw new Error('Scheduled date is required');
            }
            const notification = await Notification.create(data);
            return notification;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export { NotificationService };