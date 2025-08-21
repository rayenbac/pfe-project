import { injectable } from 'inversify';
import { Chat } from '../Models/chat';
import { IChat, IMessage } from '../Interfaces/chat/IChat';
import { UploadService } from './upload.service';
import { diContainer } from '../DI/iversify.config';
import "reflect-metadata";
import { Types } from 'mongoose';
import { logger } from '../Config/logger.config';

@injectable()
class ChatService {
    private uploadService: UploadService;

    constructor() {
        this.uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));
    }

    async getUserChats(userId: string) {
        try {
            if (!userId || !Types.ObjectId.isValid(userId)) {
                logger.error(`Invalid user ID: ${userId}`);
                return [];
            }

            const userObjectId = new Types.ObjectId(userId);
            const chats = await Chat.find({ 
                participants: userObjectId,
                isActive: true 
            })
            .populate('participants', 'firstName lastName email profileImage role status')
            .sort({ updatedAt: -1 });

            // Manually populate propertyId only if it exists
            for (const chat of chats) {
                if (chat.propertyId) {
                    await chat.populate('propertyId', 'title address media');
                }
            }
            logger.info(`Retrieved ${chats.length} chats for user ${userId}`);
            return chats;
        } catch (error) {
            logger.error('Error getting user chats:', error);
            return [];
        }
    }

    async getChat(id: string) {
        try {
            if (!id || !Types.ObjectId.isValid(id)) {
                logger.error(`Invalid chat ID: ${id}`);
                return null;
            }

            const chat = await Chat.findById(id)
                .populate('participants', 'firstName lastName email profileImage');
            if (chat && chat.propertyId) {
                await chat.populate('propertyId', 'title address media');
            }
            return chat;
        } catch (error) {
            logger.error(`Error getting chat ${id}:`, error);
            return null;
        }
    }

    async createChat(buyerId: string, sellerId: string, propertyId: string) {
        try {
            // Validate IDs
            if (!buyerId || !sellerId) {
                throw new Error('Missing required parameters');
            }

            if (!Types.ObjectId.isValid(buyerId) || !Types.ObjectId.isValid(sellerId)) {
                throw new Error('Invalid ID format');
            }

            // Convert string IDs to ObjectIds
            const buyerObjectId = new Types.ObjectId(buyerId);
            const sellerObjectId = new Types.ObjectId(sellerId);

            let propertyObjectId: any = null;
            let isDirectChat = false;
            if (propertyId && Types.ObjectId.isValid(propertyId)) {
                propertyObjectId = new Types.ObjectId(propertyId);
            } else {
                isDirectChat = true;
            }

            logger.info(`Creating chat between buyer ${buyerId} and seller ${sellerId} for property ${propertyId}`);

            // Check for existing chat
            let existingChat;
            if (isDirectChat) {
                existingChat = await Chat.findOne({
                    participants: { $all: [buyerObjectId, sellerObjectId] },
                    propertyId: { $exists: false },
                    isActive: true
                });
            } else {
                existingChat = await Chat.findOne({
                    participants: { $all: [buyerObjectId, sellerObjectId] },
                    propertyId: propertyObjectId,
                    isActive: true
                });
            }

            if (existingChat) {
                logger.info(`Found existing chat: ${existingChat._id}`);
                return existingChat;
            }

            // Create new chat
            let chat;
            if (isDirectChat) {
                chat = await Chat.create({
                    participants: [buyerObjectId, sellerObjectId],
                    messages: [],
                    isActive: true
                });
            } else {
                chat = await Chat.create({
                    participants: [buyerObjectId, sellerObjectId],
                    propertyId: propertyObjectId,
                    messages: [],
                    isActive: true
                });
            }

            logger.info(`Created new chat: ${chat._id}`);
            return chat;
        } catch (error) {
            logger.error('Error creating chat:', error);
            throw error;
        }
    }

    async sendMessage(chatId: string, sender: string, content: string, attachments?: string[]) {
        try {
            // Validate chat ID
            if (!chatId || !Types.ObjectId.isValid(chatId)) {
                throw new Error('Invalid chat ID');
            }

            // Validate sender ID
            if (!sender || !Types.ObjectId.isValid(sender)) {
                throw new Error('Invalid sender ID');
            }

            const senderObjectId = new Types.ObjectId(sender);

            const message: IMessage = {
                sender: senderObjectId,
                content,
                timestamp: new Date(),
                isRead: false,
                attachments: attachments || []
            };

            // First check if chat exists
            const chatExists = await Chat.findById(chatId);
            if (!chatExists) {
                throw new Error('Chat not found');
            }

            logger.info(`Sending message to chat ${chatId} from ${sender}`);

            const chat = await Chat.findByIdAndUpdate(
                chatId,
                { 
                    $push: { messages: message },
                    lastMessage: message
                },
                { new: true }
            );

            if (!chat) {
                throw new Error('Failed to update chat');
            }

            return chat;
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    async markMessagesAsRead(chatId: string, userId: string) {
        try {
            if (!chatId || !Types.ObjectId.isValid(chatId) || !userId || !Types.ObjectId.isValid(userId)) {
                logger.error(`Invalid IDs: chatId=${chatId}, userId=${userId}`);
                return false;
            }

            const userObjectId = new Types.ObjectId(userId);

            const result = await Chat.updateOne(
                { _id: chatId },
                { 
                    $set: { 
                        "messages.$[elem].isRead": true 
                    }
                },
                { 
                    arrayFilters: [{ 
                        "elem.sender": { $ne: userObjectId },
                        "elem.isRead": false 
                    }],
                    multi: true
                }
            );

            logger.info(`Marked messages as read in chat ${chatId} by user ${userId}. Modified: ${result.modifiedCount}`);
            return result.modifiedCount > 0;
        } catch (error) {
            logger.error(`Error marking messages as read in chat ${chatId}:`, error);
            return false;
        }
    }

    async closeChat(id: string) {
        try {
            if (!id || !Types.ObjectId.isValid(id)) {
                logger.error(`Invalid chat ID: ${id}`);
                return null;
            }

            const chat = await Chat.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );

            if (chat) {
                logger.info(`Closed chat: ${id}`);
            } else {
                logger.warn(`Failed to close chat: ${id} - not found`);
            }

            return chat;
        } catch (error) {
            logger.error(`Error closing chat ${id}:`, error);
            return null;
        }
    }

    async getChatHistory(chatId: string, limit: number = 50, before?: Date) {
        try {
            if (!chatId || !Types.ObjectId.isValid(chatId)) {
                logger.error(`Invalid chat ID: ${chatId}`);
                return [];
            }

            const query = before 
                ? { _id: chatId, "messages.timestamp": { $lt: before } }
                : { _id: chatId };

            const chat = await Chat.findOne(query)
                .select('messages')
                .slice('messages', -limit);

            logger.info(`Retrieved chat history for ${chatId}, found ${chat?.messages?.length || 0} messages`);
            return chat?.messages || [];
        } catch (error) {
            logger.error(`Error getting chat history for ${chatId}:`, error);
            return [];
        }
    }

    private async deleteMessageAttachments(messages: IMessage[]) {
        for (const message of messages) {
            if (message.attachments && message.attachments.length > 0) {
                for (const attachment of message.attachments) {
                    const filename = attachment.split('/').pop();
                    if (filename) {
                        await this.uploadService.deleteFile(filename, 'chat');
                    }
                }
            }
        }
    }
}

export { ChatService };