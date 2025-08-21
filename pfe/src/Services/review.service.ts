import { injectable } from 'inversify';
import { Review } from '../Models/review';  // Ensure the path is correct
import { IReviewRepository } from '../Interfaces/review/IReviewRepository';
import { IReview } from '../Interfaces/review/IReview';
import "reflect-metadata";
import { Document } from 'mongoose';

@injectable()
class ReviewService implements IReviewRepository {

    // Fetch all reviews for a property
    async getReviews(): Promise<(Document<unknown, any, IReview> & IReview)[]> {
        try {
            const reviews = await Review.find({}).populate('userId', 'firstName lastName profileImage');
            return reviews;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Fetch a single review by ID
    async getReview(id: string): Promise<Document<unknown, any, IReview> & IReview | null> {
        try {
            const review = await Review.findById(id).populate('userId', 'firstName lastName profileImage');
            if (!review) {
                return null;  // Or you can throw a custom error
            }
            return review;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Create a new review for a property
    async createReview(data: Omit<IReview, '_id'>): Promise<Document<unknown, any, IReview> & IReview> {
        try {
            const newReview = await Review.create(data);
            return newReview;
        } catch (error) {
            console.log(error);
            throw new Error('Error creating review');  // You can customize error handling
        }
    }

    // Update an existing review
    async updateReview(id: string, data: Partial<IReview>): Promise<Document<unknown, any, IReview> & IReview | null> {
        try {
            const review = await Review.findByIdAndUpdate(id, data, { new: true });
            if (!review) {
                return null;  // Or you can throw a custom error
            }
            return review;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Delete a review by ID
    async deleteReview(id: string): Promise<void> {
        try {
            const review = await Review.findByIdAndDelete(id);
            if (!review) {
                throw new Error('Review not found');
            }
        } catch (error) {
            console.log(error);
            throw new Error('Error deleting review');
        }
    }

    // Find reviews by property ID
    async findReviewsByProperty(propertyId: string): Promise<(Document<unknown, any, IReview> & IReview)[]> {
        try {
            const reviews = await Review.find({ property: propertyId });
            return reviews;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Find reviews by user ID (author)
    async findReviewsByUser(userId: string): Promise<(Document<unknown, any, IReview> & IReview)[]> {
        try {
            const reviews = await Review.find({ user: userId });
            return reviews;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Find reviews by rating
    async findReviewsByRating(rating: number): Promise<(Document<unknown, any, IReview> & IReview)[]> {
        try {
            const reviews = await Review.find({ rating });
            return reviews;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Find reviews by targetType and targetId
    async findReviewsByTarget(targetType: string, targetId: string): Promise<(Document<unknown, any, IReview> & IReview)[]> {
        try {
            const reviews = await Review.find({ targetType, targetId }).populate('userId', 'firstName lastName profileImage');
            return reviews;
        } catch (error) {
            console.log(error);
            return [];
        }
    }
}

export { ReviewService };
