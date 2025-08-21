import express from 'express';
import { ChatController } from '../Controllers/chat.controller';
import { diContainer } from '../DI/iversify.config';
import { ChatTYPES } from '../DI/Chat/ChatTypes';
import { UploadService } from '../Services/upload.service';
import { authenticateToken } from '../Middlewares/auth.middleware';

export const router = express.Router();

const controller = diContainer.get<ChatController>(ChatTYPES.chatController);
const uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));

// Apply authentication middleware to all chat routes
router.use(authenticateToken);

router.get('/user/:userId', controller.getUserChats);
router.get('/:id', controller.getChat);
router.post('/', controller.createChat);

// Add file upload support for message attachments
router.post('/:chatId/messages', 
    uploadService.getMulterUpload('chat').array('attachments', 5), // Allow up to 5 attachments per message
    controller.sendMessage
);

router.put('/:chatId/read', controller.markMessagesAsRead);
router.put('/:id/close', controller.closeChat);
router.get('/:chatId/history', controller.getChatHistory);

export default router;