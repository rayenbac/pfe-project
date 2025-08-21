import { ReviewService } from '../Services/review.service'; // Import the ReviewService
import { injectable, inject } from 'inversify';
import { ReviewTYPES } from "../DI/Review/ReviewTypes"; // Ensure the path is correct
import { Request, Response } from 'express';
import { IReview } from '../Interfaces/review/IReview';
import { ReviewSchemaValidate } from '../Models/review'; // Assuming you have a Review schema validator
import { realtimeNotificationService } from '../Server/app';
import { AuthenticatedUser } from '../types/auth';
import { User } from '../Models/user';

@injectable()
class ReviewController {
    private service: ReviewService;

    constructor(@inject(ReviewTYPES.reviewService) service: ReviewService) {
        this.service = service;
    }

    // Get all reviews or filter by targetType and targetId
    getReviews = async (req: Request, res: Response) => {
        const { targetType, targetId } = req.query;
        if (targetType && targetId) {
            const reviews = await this.service.findReviewsByTarget(targetType as string, targetId as string);
            return res.status(200).send(reviews);
        }
        const reviews = await this.service.getReviews();
        res.status(200).send(reviews);
    }

    // Get a single review
    getReview = async (req: Request, res: Response) => {
        const id = req.params.id;
        const review = await this.service.getReview(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.status(200).send(review);
    }

    // Add a new review
    addReview = async (req: Request, res: Response) => {
        console.log('Review submission received:', req.body);
        console.log('User from request:', req.user);
        
        const { error, value } = ReviewSchemaValidate.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.message });
        }

        const review = await this.service.createReview(value); // Pass validated data
        console.log('Review created:', review);
        
        // Send notification for property review
        if (review && value.targetType === 'property' && realtimeNotificationService && req.user) {
            console.log('Sending property review notification...');
            const user = await User.findById((req.user as AuthenticatedUser)._id);
            if (user) {
                await realtimeNotificationService.notifyPropertyReviewed(
                    (req.user as AuthenticatedUser)._id,
                    {
                        targetId: value.targetId,
                        reviewId: review._id.toString(),
                        reviewerName: `${user.firstName} ${user.lastName}`,
                        rating: value.rating
                    }
                );
            }
        }

        // Send notification for post review
        if (review && value.targetType === 'post' && realtimeNotificationService && req.user) {
            console.log('Sending post review notification for targetId:', value.targetId);
            const user = await User.findById((req.user as AuthenticatedUser)._id);
            if (user) {
                console.log('Found user for notification:', user.firstName, user.lastName);
                await realtimeNotificationService.notifyPostReviewed(
                    (req.user as AuthenticatedUser)._id,
                    {
                        targetId: value.targetId,
                        reviewId: review._id.toString(),
                        reviewerName: `${user.firstName} ${user.lastName}`,
                        rating: value.rating
                    }
                );
                console.log('Post review notification sent');
            }
        }

        res.status(201).send(review);
    }

    // Update a review
    updateReview = async (req: Request, res: Response) => {
        const id = req.params.id;
        const review = await this.service.updateReview(id, req.body);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.status(200).send(review);
    }

    // Delete a review
    deleteReview = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.service.deleteReview(id);
        res.status(200).send({ message: 'Review deleted' });
    }

    // Find reviews by user
    findReviewByUser = async (req: Request, res: Response) => {
        const userId = req.params.userId;
        const reviews = await this.service.findReviewsByUser(userId);
        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this user' });
        }
        res.status(200).send(reviews);
    }

    // Get current user's reviews (authenticated)
    getCurrentUserReviews = async (req: Request, res: Response) => {
        try {
            // Get user ID from JWT token (assumes middleware sets req.user)
            const userId = (req as any).user?.userId || (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
            
            const reviews = await this.service.findReviewsByUser(userId);
            res.status(200).send(reviews || []);
        } catch (error) {
            console.error('Error getting current user reviews:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Find reviews by rating
    findReviewByRating = async (req: Request, res: Response) => {
        const rating = Number(req.params.rating);
        if (isNaN(rating)) {
            return res.status(400).json({ message: 'Invalid rating value' });
        }
        const reviews = await this.service.findReviewsByRating(rating);
        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found with this rating' });
        }
        res.status(200).send(reviews);
    }
}

export { ReviewController };
