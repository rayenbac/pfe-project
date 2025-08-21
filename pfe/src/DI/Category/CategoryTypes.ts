import { ICategory } from '../../Interfaces/category/ICategory';
import { Document, Types } from 'mongoose';

export const CategoryTYPES = {
    categoryService: Symbol.for("CategoryService"),
    controller: Symbol.for("CategoryController"),
};

type CommonCategoryType = Document<unknown, any, ICategory> & ICategory & {
    _id: Types.ObjectId;
};

export type getCategoriesReturnType = Promise<CommonCategoryType[] | undefined>;

export type returnCategoryType = Promise<CommonCategoryType | string | undefined>;
