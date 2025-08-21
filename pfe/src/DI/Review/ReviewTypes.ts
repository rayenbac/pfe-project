import { IReview } from '../../Interfaces/review/IReview';
import { Document, Types } from 'mongoose';

export const ReviewTYPES = {
    reviewService: Symbol.for("ReviewService"),
    reviewController: Symbol.for("ReviewController"),
};

// Not directly related to DI, custom type alias
type CommonReviewType = Document<unknown, any, IReview> & IReview & {
    _id: Types.ObjectId;
};

export type getReviewsReturnType = Promise<CommonReviewType[] | undefined>;

export type returnReviewType = Promise<CommonReviewType | string | undefined>;

export enum SORT_REVIEW_OPT {
    rating = "rating",
    date = "date"
}
