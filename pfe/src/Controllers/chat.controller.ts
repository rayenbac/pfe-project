import { ChatService } from '../Services/chat.service';
import { injectable, inject } from 'inversify';
import { ChatTYPES } from "../DI/Chat/ChatTypes";
import { Request, Response } from 'express';
import { ChatSchemaValidate, MessageSchemaValidate } from '../Models/chat';
import { UploadService } from '../Services/upload.service';
import { diContainer } from '../DI/iversify.config';
import { logger } from '../Config/logger.config';

@injectable()
class ChatController {
    private service: ChatService;
    private uploadService: UploadService;

    constructor(@inject(ChatTYPES.chatService) service: ChatService) {
        this.service = service;
        this.uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));
    }

    // Get user chats
    getUserChats = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId;
            const chats = await this.service.getUserChats(userId);
            res.status(200).send(chats);
        } catch (error) {
            logger.error('Error getting user chats:', error);
            res.status(500).json({ message: 'Error retrieving chats' });
        }
    }

    // Get single chat
    getChat = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const chat = await this.service.getChat(id);
            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }
            res.status(200).send(chat);
        } catch (error) {
            logger.error('Error getting chat:', error);
            res.status(500).json({ message: 'Error retrieving chat' });
        }
    }

    // Create new chat
    createChat = async (req: Request, res: Response) => {
        try {
            const { buyerId, sellerId, propertyId } = req.body;
            
            // Validate required fields
            if (!buyerId || !sellerId || !propertyId) {
                return res.status(400).json({ 
                    message: 'Missing required fields', 
                    details: { 
                        buyerId: buyerId ? 'valid' : 'missing', 
                        sellerId: sellerId ? 'valid' : 'missing', 
                        propertyId: propertyId ? 'valid' : 'missing' 
                    } 
                });
            }
            
            logger.info(`Creating chat: buyer=${buyerId}, seller=${sellerId}, property=${propertyId}`);
            const chat = await this.service.createChat(buyerId, sellerId, propertyId);
            res.status(201).send(chat);
        } catch (error: any) {
            logger.error('Error creating chat:', error);
            res.status(500).json({ message: 'Error creating chat', details: error.message });
        }
    }

    // Send message
    sendMessage = async (req: Request, res: Response) => {
        try {
            const chatId = req.params.chatId;
            
            // Validate chat ID
            if (!chatId) {
                return res.status(400).json({ message: 'Chat ID is required' });
            }
            
            // Check if there are file uploads
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                const attachments = (req.files as Express.Multer.File[]).map(file => 
                    this.uploadService.getFilePath(file.filename, 'chat')
                );
                
                const sender = req.body.sender;
                const content = req.body.content || '';
                
                if (!sender) {
                    return res.status(400).json({ message: 'Sender ID is required' });
                }
                
                logger.info(`Sending message with attachments: chat=${chatId}, sender=${sender}, attachments=${attachments.length}`);
                const chat = await this.service.sendMessage(
                    chatId,
                    sender,
                    content,
                    attachments
                );
                
                return res.status(200).send(chat);
            } 
            
            // Regular validation for text-only messages
            const { error, value } = MessageSchemaValidate.validate(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }
            
            logger.info(`Sending text message: chat=${chatId}, sender=${value.sender}`);
            const chat = await this.service.sendMessage(
                chatId,
                value.sender,
                value.content,
                value.attachments
            );
            
            res.status(200).send(chat);
        } catch (error: any) {
            logger.error('Error sending message:', error);
            res.status(500).json({ 
                message: 'Error sending message',
                details: error.message 
            });
        }
    }

    // Mark messages as read
    markMessagesAsRead = async (req: Request, res: Response) => {
        try {
            const chatId = req.params.chatId;
            const userId = req.body.userId;
            
            if (!chatId || !userId) {
                return res.status(400).json({ message: 'Chat ID and User ID are required' });
            }
            
            const success = await this.service.markMessagesAsRead(chatId, userId);
            if (success) {
                res.status(200).json({ message: 'Messages marked as read' });
            } else {
                res.status(500).json({ message: 'Error marking messages as read' });
            }
        } catch (error) {
            logger.error('Error marking messages as read:', error);
            res.status(500).json({ message: 'Error marking messages as read' });
        }
    }

    // Close chat
    closeChat = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const chat = await this.service.closeChat(id);
            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }
            res.status(200).send(chat);
        } catch (error) {
            logger.error('Error closing chat:', error);
            res.status(500).json({ message: 'Error closing chat' });
        }
    }

    // Get chat history
    getChatHistory = async (req: Request, res: Response) => {
        try {
            const chatId = req.params.chatId;
            const limit = parseInt(req.query.limit as string) || 50;
            const before = req.query.before ? new Date(req.query.before as string) : undefined;
            
            const messages = await this.service.getChatHistory(chatId, limit, before);
            res.status(200).send(messages);
        } catch (error) {
            logger.error('Error getting chat history:', error);
            res.status(500).json({ message: 'Error retrieving chat history' });
        }
    }
}

export { ChatController };