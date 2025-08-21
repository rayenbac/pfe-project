import { UserService } from '../Services/user.service';
import { UserSchemaValidate, User } from '../Models/user';
import { injectable, inject } from 'inversify';
import { UserTYPES } from "../DI/User/UserTypes";
import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../Services/upload.service';
import { diContainer } from '../DI/iversify.config';
import { realtimeNotificationService } from '../Server/app';
import { AuthenticatedUser } from '../types/auth';

@injectable()
class UserController {
    private service: UserService;
    private uploadService: UploadService;

    constructor(
        @inject(UserTYPES.userService) service: UserService
    ) {
        this.service = service;
        this.uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));
    }

    // Get all users
    getUsers = async (req: Request, res: Response) => {
        const users = await this.service.getUsers();
        res.send(users);
    }

    // Get a single user
    getUser = async (req: Request, res: Response) => {
        const id = req.params.id;
        const user = await this.service.getUser(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).send(user);
    }

    // Add a new user
    addUser = async (req: Request, res: Response) => {
        try {
            const { error, value } = UserSchemaValidate.validate(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }

            // Handle profile image upload
            if (req.file) {
                const filePath = this.uploadService.getFilePath(req.file.filename, 'profile');
                value.profileImage = filePath;
            }

            const user = await this.service.createUser(value);
            res.status(201).send(user);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Update a user
    updateUser = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const updateData = { ...req.body };

            // Handle profile image upload
            if (req.file) {
                const filePath = this.uploadService.getFilePath(req.file.filename, 'profile');
                updateData.profileImage = filePath;
            }

            // Handle social media JSON string
            if (updateData.socialMedia && typeof updateData.socialMedia === 'string') {
                try {
                    updateData.socialMedia = JSON.parse(updateData.socialMedia);
                } catch (error) {
                    console.error('Error parsing socialMedia JSON:', error);
                    delete updateData.socialMedia;
                }
            }

            const user = await this.service.updateUser(id, updateData);
            res.status(200).send(user);
        } catch (error: any) {
            if (error.message === 'User not found') {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === 'Invalid user ID') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Error updating user' });
        }
    }

    // Upload verification image
    uploadVerificationImage = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            if (!req.file) {
                return res.status(400).json({ message: 'No verification image provided' });
            }

            const filePath = this.uploadService.getFilePath(req.file.filename, 'verification');
            const user = await this.service.updateUser(id, { verificationImage: filePath });
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.send(user);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Delete a user
    deleteUser = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.service.deleteUser(id);
        res.send({ message: 'User deleted' });
    }

    // Get all agents
    getAgents = async (req: Request, res: Response) => {
        try {
            const agents = await this.service.getAgents();
            res.status(200).json(agents);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching agents' });
        }
    }

    // Get agent by slug
    getAgentBySlug = async (req: Request, res: Response) => {
        try {
            const slug = req.params.slug;
            const agent = await this.service.getAgentBySlug(slug);
            if (!agent) {
                return res.status(404).json({ message: 'Agent not found' });
            }
            res.send(agent);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Block a user (Admin only)
    blockUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const adminId = (req as any).user?._id;

            if (!reason) {
                return res.status(400).json({ message: 'Block reason is required' });
            }

            const result = await this.service.blockUser(id, reason, adminId);
            
            if (result === '404') {
                return res.status(404).json({ message: 'User not found' });
            }

            // Send notification to the blocked user
            if (realtimeNotificationService && typeof result === 'object') {
                try {
                    const admin = await User.findById(adminId);
                    await realtimeNotificationService.notifyUserBlocked(
                        id,
                        {
                            reason: reason,
                            adminName: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin'
                        }
                    );
                } catch (notificationError) {
                    console.error('Failed to send user blocked notification:', notificationError);
                }
            }

            res.status(200).json({
                success: true,
                message: 'User blocked successfully',
                data: result
            });
        } catch (error: any) {
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // Unblock a user (Admin only)
    unblockUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const adminId = (req as any).user?._id;
            const result = await this.service.unblockUser(id);
            
            if (result === '404') {
                return res.status(404).json({ message: 'User not found' });
            }

            // Send notification to the unblocked user
            if (realtimeNotificationService && typeof result === 'object') {
                try {
                    const admin = await User.findById(adminId);
                    await realtimeNotificationService.notifyUserUnblocked(
                        id,
                        admin ? `${admin.firstName} ${admin.lastName}` : 'Admin'
                    );
                } catch (notificationError) {
                    console.error('Failed to send user unblocked notification:', notificationError);
                }
            }

            res.status(200).json({
                success: true,
                message: 'User unblocked successfully',
                data: result
            });
        } catch (error: any) {
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    // Get blocked users (Admin only)
    getBlockedUsers = async (req: Request, res: Response) => {
        try {
            const blockedUsers = await this.service.getBlockedUsers();
            res.status(200).json({
                success: true,
                data: blockedUsers
            });
        } catch (error: any) {
            res.status(500).json({ 
                success: false,
                message: 'Failed to fetch blocked users' 
            });
        }
    }
}

export { UserController };