import { IProperty } from '../../Interfaces/property/IProperty';
import { Document, Types } from 'mongoose';

export const PropertyTYPES = {
    propertyService: Symbol.for("PropertyService"),
    propertycontroller: Symbol.for("PropertyController"),
};

// Not directly related to DI, custom type alias
type CommonPropertyType = Document<unknown, any, IProperty> & IProperty & {
    _id: Types.ObjectId;
};

export type getPropertiesReturnType = Promise<CommonPropertyType[] | undefined>;

export type resultPropertyType = CommonPropertyType[];

export type returnPropertyType = Promise<CommonPropertyType | string | undefined>;

export enum SORT_PROPERTY_OPT {
    price = "price",
    location = "location",
    type = "type"
}
