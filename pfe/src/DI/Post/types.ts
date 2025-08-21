
import {  IPost } from '../../Interfaces/post/IPost'
import { Document, Types } from 'mongoose' 

export const TYPES = {
    service: Symbol.for("PostService"),
    controller: Symbol.for("postController"),
}

// not directly related with DI, custom type alias
type CommonType = Document<unknown, any, IPost> & IPost & {
    _id: Types.ObjectId;
  }
export type getPostsReturnType = Promise<CommonType[] | undefined>

export type resultType = CommonType[]

export type  returnType = Promise<CommonType | string | undefined>

export enum SORT_OPT{
  author = "author",
  description ="description",
  title = "title",
  likes = "likes"
}

