import { Router, Request, Response } from 'express';
import { 
  getRecommenderResults, 
  getRecommendationsWithDetails,
  getSimilarProperties,
  getSimilarPropertiesWithDetails,
  getUserPreferences,
  getTrendingProperties,
  getContentBasedRecommendations,
  getGuestRecommendations
} from '../Controllers/recommender.controller';
import { authenticateToken } from '../Middlewares/auth.middleware';

const router = Router();

// Basic recommendations (using Python API)
router.get('/', getRecommenderResults);

// Homepage recommendations with full property details
router.get('/homepage/:userId', (req: Request, res: Response) => {
  // Convert path parameter to query parameter for the existing controller
  req.query.user_id = req.params.userId;
  getRecommendationsWithDetails(req, res);
});

// Enhanced recommendations with full property details
router.get('/detailed', getRecommendationsWithDetails);

// Similar properties
router.get('/similar', getSimilarProperties);

// Similar properties with full details
router.get('/similar/detailed', getSimilarPropertiesWithDetails);

// User preferences analysis
router.get('/preferences', authenticateToken, getUserPreferences);

// Trending properties
router.get('/trending', getTrendingProperties);

// Content-based recommendations using MongoDB data
router.get('/content-based', authenticateToken, getContentBasedRecommendations);

// Guest user recommendations based on cookies
router.post('/guest', getGuestRecommendations);

export default router; 