import { INotification } from '../../Interfaces/notification/INotification';
import { Document, Types } from 'mongoose';

export const NotificationTYPES = {
    notificationService: Symbol.for("NotificationService"),
    notificationController: Symbol.for("NotificationController"),
};

export type CommonNotificationType = Document<unknown, any, INotification> & INotification & {
    _id: Types.ObjectId;
};

export type getNotificationsReturnType = Promise<CommonNotificationType[] | undefined>;
export type returnNotificationType = Promise<CommonNotificationType | string | undefined>;