import { resultType } from "../DI/Post/types"

export interface IResult{
    total: number
    limit: number
    posts: resultType
}