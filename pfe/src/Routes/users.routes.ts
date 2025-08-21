import express from 'express';
import { UserController } from '../Controllers/user.controller';
import { diContainer } from '../DI/iversify.config';
import { UserTYPES } from '../DI/User/UserTypes';
import { uploadProfileImage, uploadVerificationImage, handleUploadError } from '../Middlewares/upload.middleware';
import { authenticateToken, requireRole } from '../Middlewares/auth.middleware';
import { UserRole } from '../Constants/enums';

export const router = express.Router();

const controller = diContainer.get<UserController>(UserTYPES.controller);

// User routes
router.post('/', 
    uploadProfileImage,
    handleUploadError,
    controller.addUser
);

router.get('/', controller.getUsers);
router.get('/agents', controller.getAgents);
router.get('/agents/slug/:slug', controller.getAgentBySlug);
router.get('/blocked', authenticateToken, requireRole([UserRole.ADMIN]), controller.getBlockedUsers);
router.get('/:id', controller.getUser);

router.put('/:id',
    uploadProfileImage,
    handleUploadError,
    controller.updateUser
);

router.post('/:id/verification-image',
    uploadVerificationImage,
    handleUploadError,
    controller.uploadVerificationImage
);

// Admin-only blocking routes
router.put('/:id/block', authenticateToken, requireRole([UserRole.ADMIN]), controller.blockUser);
router.put('/:id/unblock', authenticateToken, requireRole([UserRole.ADMIN]), controller.unblockUser);

router.delete('/:id', controller.deleteUser);

export default router;