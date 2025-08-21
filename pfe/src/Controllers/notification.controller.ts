import { NotificationService } from '../Services/notification.service';
import { RealtimeNotificationService } from '../Services/realtime-notification.service';
import { injectable, inject } from 'inversify';
import { NotificationTYPES } from "../DI/Notification/NotificationTypes";
import { Request, Response } from 'express';
import { NotificationSchemaValidate } from '../Models/notification';
import { AuthenticatedUser } from '../types/auth';

@injectable()
class NotificationController {
    private service: NotificationService;
    private realtimeService: RealtimeNotificationService;

    constructor(
        @inject(NotificationTYPES.notificationService) service: NotificationService,
        @inject('RealtimeNotificationService') realtimeService: RealtimeNotificationService
    ) {
        this.service = service;
        this.realtimeService = realtimeService;
    }

    // Get user notifications
    getUserNotifications = async (req: Request, res: Response) => {
        const userId = req.params.userId;
        const notifications = await this.service.getUserNotifications(userId);
        res.status(200).send(notifications);
    }

    // Get unread notifications
    getUnreadNotifications = async (req: Request, res: Response) => {
        const userId = req.params.userId;
        const notifications = await this.service.getUnreadNotifications(userId);
        res.status(200).send(notifications);
    }

    // Create notification
    createNotification = async (req: Request, res: Response) => {
        const { error, value } = NotificationSchemaValidate.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        try {
            const notification = await this.service.createNotification(value);
            res.status(201).send(notification);
        } catch (error) {
            res.status(500).json({ message: 'Error creating notification' });
        }
    }

    // Mark as read
    markAsRead = async (req: Request, res: Response) => {
        const id = req.params.id;
        const userId = (req.user as AuthenticatedUser)?._id;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const notification = await this.service.markAsRead(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Mark as read in real-time
        await this.realtimeService.markNotificationAsRead(id, userId.toString());
        
        res.status(200).send(notification);
    }

    // Mark all as read
    markAllAsRead = async (req: Request, res: Response) => {
        const userId = req.params.userId;
        const success = await this.service.markAllAsRead(userId);
        if (success) {
            res.status(200).json({ message: 'All notifications marked as read' });
        } else {
            res.status(500).json({ message: 'Error marking notifications as read' });
        }
    }

    // Delete notification
    deleteNotification = async (req: Request, res: Response) => {
        const id = req.params.id;
        const userId = (req.user as AuthenticatedUser)?._id;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const success = await this.service.deleteNotification(id);
        if (success) {
            // Delete in real-time
            await this.realtimeService.deleteNotification(id, userId.toString());
            res.status(200).json({ message: 'Notification deleted' });
        } else {
            res.status(500).json({ message: 'Error deleting notification' });
        }
    }

    // Delete all notifications
    deleteAllNotifications = async (req: Request, res: Response) => {
        const userId = (req.user as AuthenticatedUser)?._id;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Delete from database
        await this.service.deleteAllNotifications(userId.toString());
        
        // Delete in real-time
        await this.realtimeService.deleteAllNotifications(userId.toString());
        
        res.status(200).json({ message: 'All notifications deleted' });
    }

    // Schedule notification
    scheduleNotification = async (req: Request, res: Response) => {
        const { error, value } = NotificationSchemaValidate.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        try {
            const notification = await this.service.scheduleNotification(value);
            res.status(201).send(notification);
        } catch (error) {
            res.status(400).json({ message: 'Error scheduling notification' });
        }
    }
}

export { NotificationController };