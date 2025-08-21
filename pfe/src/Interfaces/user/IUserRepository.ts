import { returnUserType, getUsersReturnType } from '../../DI/User/UserTypes';

export interface IUserRepository {
    getUsers(): getUsersReturnType;
    getUser(id: string): returnUserType;
    createUser(data: any): returnUserType;
    updateUser(id: string, data: any): returnUserType;
    deleteUser(id: string): void;
}
