import { IUser } from '../../Interfaces/user/IUser';
import { Document, Types } from 'mongoose';

export const UserTYPES = {
    userService: Symbol.for("UserService"),
    controller: Symbol.for("UserController"),
};

// Not directly related to DI, custom type alias
type CommonUserType = Document<unknown, any, IUser> & IUser & {
    _id: Types.ObjectId;
};

export type getUsersReturnType = Promise<CommonUserType[] | undefined>;

export type resultUserType = CommonUserType[];

export type returnUserType = Promise<CommonUserType | string | undefined>;

export enum SORT_USER_OPT {
    username = "username",
    email = "email",
    role = "role"
}
