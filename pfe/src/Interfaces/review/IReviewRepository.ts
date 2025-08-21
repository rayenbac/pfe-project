import { IReview } from './IReview';
import { Document } from 'mongoose';

export interface IReviewRepository {
    getReviews(): Promise<(Document<unknown, any, IReview> & IReview)[]>; // Get all reviews
    getReview(id: string): Promise<Document<unknown, any, IReview> & IReview | null>; // Get a single review by ID
    createReview(data: Omit<IReview, '_id'>): Promise<Document<unknown, any, IReview> & IReview>; // Create a new review
    updateReview(id: string, data: Partial<IReview>): Promise<Document<unknown, any, IReview> & IReview | null>; // Update a review
    deleteReview(id: string): Promise<void>; // Delete a review
    findReviewsByProperty(propertyId: string): Promise<(Document<unknown, any, IReview> & IReview)[]>; // Find reviews by property
    findReviewsByUser(userId: string): Promise<(Document<unknown, any, IReview> & IReview)[]>; // Find reviews by user
    findReviewsByRating(rating: number): Promise<(Document<unknown, any, IReview> & IReview)[]>; // Find reviews by rating
}
