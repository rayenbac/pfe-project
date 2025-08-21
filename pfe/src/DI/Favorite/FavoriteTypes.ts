import { IFavorite } from '../../Interfaces/favorite/IFavorite';
import { Document, Types } from 'mongoose';

export const FavoriteTYPES = {
    favoriteService: Symbol.for("FavoriteService"),
    favoriteController: Symbol.for("FavoriteController"),
};

// Not directly related to DI, custom type alias
export type CommonFavoriteType = Document<unknown, any, IFavorite> & IFavorite & {
    _id: Types.ObjectId;
};

export type getFavoritesReturnType = Promise<CommonFavoriteType[] | undefined>;

export type returnFavoriteType = Promise<CommonFavoriteType | string | undefined>;
