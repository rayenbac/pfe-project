import { IFavorite } from './IFavorite';
import { Document } from 'mongoose';

export interface IFavoriteRepository {
    getFavorites(): Promise<(Document<unknown, any, IFavorite> & IFavorite)[]>;
    getFavorite(id: string): Promise<Document<unknown, any, IFavorite> & IFavorite | null>;
    createFavorite(data: Omit<IFavorite, '_id'>): Promise<Document<unknown, any, IFavorite> & IFavorite>;
    updateFavorite(id: string, data: Partial<IFavorite>): Promise<Document<unknown, any, IFavorite> & IFavorite | null>;
    deleteFavorite(id: string): Promise<void>;
    addPropertyToFavorite(id: string, property: any): Promise<Document<unknown, any, IFavorite> & IFavorite | null>;
    findFavoriteByUser(userId: string): Promise<(Document<unknown, any, IFavorite> & IFavorite)[]>;
    findFavoriteByName(name: string): Promise<(Document<unknown, any, IFavorite> & IFavorite)[]>;
}