import { IUser } from '../Interfaces/user/IUser';
import { injectable } from 'inversify';
import { User } from '../Models/user';
import "reflect-metadata";
import { Document, Types } from 'mongoose';
import { IUserRepository } from '../Interfaces/user/IUserRepository';
import { UploadService } from './upload.service';
import { diContainer } from '../DI/iversify.config';


@injectable()
class UserService implements IUserRepository {


    private uploadService: UploadService;

    constructor() {
        this.uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));
    }

    async getUsers() {
        try {
            const users = await User.find({});
            return users;
        } catch (error) {
            console.log(error);
        }
    }

    async getUser(id: string) {
        try {
            const user = await User.findById({ _id: id });
            if (!user) {
                return '404';
            }
            return user;
        } catch (error) {
            console.log(error);
            return '404';
        }
    }

    async createUser(data: any) {
        try {
            const newUser = await User.create(data);
            return newUser;
        } catch (error) {
            console.log(error);
        }
    }

    async updateUser(id: string, data: any) {
        try {
            if (!id || !Types.ObjectId.isValid(id)) {
                throw new Error('Invalid user ID');
            }

            // Handle agencyId specifically
            if (data.agencyId === 'null') {
                data.agencyId = null;
            }

            const user = await User.findByIdAndUpdate(
                { _id: id },
                data,
                { new: true, runValidators: true }
            );

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error: any) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async deleteUser(id: string) {
        try {
            const user = await User.findByIdAndDelete(id);
            if (!user) {
                return 'User not found';
            }
        } catch (error) {
            console.log(error);
        }
    }

    async search(q: string, queryPool: { sortType: string, pageIndex: number, orderBy: 1 | -1 }, limit: number = 5) {
        try {
            const result = await User.find({ $text: { $search: q, $caseSensitive: true } })
                .sort({ [queryPool.sortType]: queryPool.orderBy })
                .skip((queryPool.pageIndex - 1) * limit)
                .limit(limit);
            return result;
        } catch (error) {
            console.log(error);
        }
    }

    async getAgents() {
        try {
            const agents = await User.find({ role: 'agent' });
            return agents;
        } catch (error) {
            console.log(error);
        }
    }

    // Get agent by slug (created from firstName and lastName)
    async getAgentBySlug(slug: string) {
        try {
            // Convert slug back to name parts
            const nameParts = slug.split('-');
            if (nameParts.length < 2) {
                return null;
            }
            
            // Create a regex pattern that matches firstName-lastName combinations
            // Handle cases where names might have been modified during slug creation
            const firstNamePattern = nameParts[0];
            const lastNamePattern = nameParts.slice(1).join('-');
            
            const agent = await User.findOne({
                role: 'agent',
                $or: [
                    {
                        firstName: new RegExp(`^${firstNamePattern}$`, 'i'),
                        lastName: new RegExp(`^${lastNamePattern}$`, 'i')
                    },
                    {
                        // Try to match against the full name if hyphenated
                        firstName: new RegExp(`^${nameParts.join(' ')}$`, 'i')
                    }
                ]
            });
            
            return agent;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Block user
    async blockUser(userId: string, reason: string, blockedBy: string) {
        try {
            if (!Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid user ID');
            }

            const user = await User.findByIdAndUpdate(
                userId,
                {
                    isBlocked: true,
                    blockReason: reason,
                    blockedBy: new Types.ObjectId(blockedBy),
                    blockedAt: new Date()
                },
                { new: true }
            ).populate('blockedBy', 'firstName lastName');

            if (!user) {
                return '404';
            }

            return user;
        } catch (error: any) {
            console.error('Error blocking user:', error);
            throw error;
        }
    }

    // Unblock user
    async unblockUser(userId: string) {
        try {
            if (!Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid user ID');
            }

            const user = await User.findByIdAndUpdate(
                userId,
                {
                    isBlocked: false,
                    blockReason: undefined,
                    blockedBy: undefined,
                    blockedAt: undefined
                },
                { new: true }
            );

            if (!user) {
                return '404';
            }

            return user;
        } catch (error: any) {
            console.error('Error unblocking user:', error);
            throw error;
        }
    }

    // Get all blocked users
    async getBlockedUsers() {
        try {
            const blockedUsers = await User.find({ isBlocked: true })
                .populate('blockedBy', 'firstName lastName')
                .sort({ blockedAt: -1 });
            
            return blockedUsers;
        } catch (error: any) {
            console.error('Error fetching blocked users:', error);
            throw error;
        }
    }
}

export { UserService };
