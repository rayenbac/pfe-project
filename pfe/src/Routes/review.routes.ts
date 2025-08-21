// Importing modules
import express from 'express';
import { ReviewController } from '../Controllers/review.controller'; // Import the ReviewController
import { diContainer } from '../DI/iversify.config';
import { ReviewTYPES } from '../DI/Review/ReviewTypes'; // Ensure the path is correct
import { authenticateToken } from '../Middlewares/auth.middleware';

// Initiating the router
export const router = express.Router();

// Getting the controller instance from the DI container
const controller = diContainer.get<ReviewController>(ReviewTYPES.reviewController); // Get ReviewController from DI container

// Review routes
router.post('/', authenticateToken, controller.addReview); // Create a new review (requires authentication)
router.get('/', controller.getReviews); // Get all reviews
router.get('/user', controller.getCurrentUserReviews); // Get current user's reviews (authenticated)
router.get('/:id', controller.getReview); // Get a single review by ID
router.put('/:id', controller.updateReview); // Update a review
router.delete('/:id', controller.deleteReview); // Delete a review
// router.get('/property/:propertyId', controller.findReviewByProperty); // Find reviews by property ID
router.get('/user/:userId', controller.findReviewByUser); // Find reviews by user ID
router.get('/rating/:rating', controller.findReviewByRating); // Find reviews by rating

// Universal entity review routes
router.get('/agent/:agentId', controller.getReviews); // Get reviews for an agent (via query params)
router.get('/property/:propertyId', controller.getReviews); // Get reviews for a property (via query params)
router.get('/agency/:agencyId', controller.getReviews); // Get reviews for an agency (via query params)
router.get('/post/:postId', controller.getReviews); // Get reviews for a post (via query params)

export default router;
