import express from 'express';
import { NotificationController } from '../Controllers/notification.controller';
import { diContainer } from '../DI/iversify.config';
import { NotificationTYPES } from '../DI/Notification/NotificationTypes';
import { authenticateToken } from '../Middlewares/auth.middleware';

export const router = express.Router();

const controller = diContainer.get<NotificationController>(NotificationTYPES.notificationController);

router.get('/user/:userId', authenticateToken, controller.getUserNotifications);
router.get('/user/:userId/unread', authenticateToken, controller.getUnreadNotifications);
router.post('/', authenticateToken, controller.createNotification);
router.put('/:id/read', authenticateToken, controller.markAsRead);
router.put('/user/:userId/read-all', authenticateToken, controller.markAllAsRead);
router.delete('/:id', authenticateToken, controller.deleteNotification);
router.delete('/user/all', authenticateToken, controller.deleteAllNotifications);
router.post('/schedule', authenticateToken, controller.scheduleNotification);

export default router;