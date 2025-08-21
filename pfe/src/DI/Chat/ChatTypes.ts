import { IChat } from '../../Interfaces/chat/IChat';
import { Document, Types } from 'mongoose';

export const ChatTYPES = {
    chatService: Symbol.for("ChatService"),
    chatController: Symbol.for("ChatController"),
};

export type CommonChatType = Document<unknown, any, IChat> & IChat & {
    _id: Types.ObjectId;
};

export type getChatsReturnType = Promise<CommonChatType[] | undefined>;
export type returnChatType = Promise<CommonChatType | string | undefined>;