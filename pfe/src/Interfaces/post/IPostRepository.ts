import { returnType, getPostsReturnType } from '../../DI/Post/types'

export interface IPostRepository {
    getPosts(): getPostsReturnType
    getPost(id: string): returnType
    createPost(data: any): returnType
    updatePost(id: String, data: any): returnType
    deletePost(id: String): void
    getChunk(pageIndex: any, limit: number): void // pagination
}