import { Request, Response } from 'express';
import { RecommenderService } from '../Services/recommender.service';
import { logger } from '../Config/logger.config';

const recommenderService = new RecommenderService();

export const getRecommenderResults = async (req: Request, res: Response) => {
  try {
    const { user_id, type = 'hybrid', n = 5 } = req.query;
    
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    const data = await recommenderService.getRecommendations(user_id, type as string, Number(n));
    res.json(data);
  } catch (error: any) {
    logger.error('Error in getRecommenderResults:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getRecommendationsWithDetails = async (req: Request, res: Response) => {
  try {
    const { user_id, type = 'content-based', n = 5 } = req.query;
    
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    // Use content-based recommendations from our database
    const recommendations = await recommenderService.getContentBasedRecommendationsFromDB(user_id, Number(n));
    
    res.json({
      recommendations,
      total_count: recommendations.length,
      type: 'content-based',
      user_id
    });
  } catch (error: any) {
    logger.error('Error in getRecommendationsWithDetails:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSimilarProperties = async (req: Request, res: Response) => {
  try {
    const { property_id, n = 5 } = req.query;
    
    if (!property_id || typeof property_id !== 'string') {
      return res.status(400).json({ error: 'property_id is required' });
    }
    
    const data = await recommenderService.getSimilarProperties(property_id, Number(n));
    res.json(data);
  } catch (error: any) {
    logger.error('Error in getSimilarProperties:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSimilarPropertiesWithDetails = async (req: Request, res: Response) => {
  try {
    const { property_id, n = 5 } = req.query;
    
    if (!property_id || typeof property_id !== 'string') {
      return res.status(400).json({ error: 'property_id is required' });
    }
    
    const data = await recommenderService.getSimilarPropertiesWithFullDetails(property_id, Number(n));
    res.json(data);
  } catch (error: any) {
    logger.error('Error in getSimilarPropertiesWithDetails:', error);
    // Return empty result instead of error to prevent frontend crashes
    res.json({ 
      similar_properties: [], 
      total_count: 0,
      message: 'Recommendation service temporarily unavailable' 
    });
  }
};

export const getUserPreferences = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    const data = await recommenderService.getUserPreferences(user_id);
    res.json(data);
  } catch (error: any) {
    logger.error('Error in getUserPreferences:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTrendingProperties = async (req: Request, res: Response) => {
  try {
    const { n = 10 } = req.query;
    
    const data = await recommenderService.getTrendingProperties(Number(n));
    res.json(data);
  } catch (error: any) {
    logger.error('Error in getTrendingProperties:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getGuestRecommendations = async (req: Request, res: Response) => {
  try {
    const { preferences, viewedProperties, userLocation, limit = 6 } = req.body;
    
    const recommendations = await recommenderService.getGuestRecommendations({
      preferences,
      viewedProperties,
      userLocation,
      limit: Number(limit)
    });
    
    // Handle both array response (normal) and object response (fallback from trending)
    if (Array.isArray(recommendations)) {
      res.json({
        recommendations,
        total_count: recommendations.length,
        type: 'guest-recommendations'
      });
    } else {
      // This is a trending properties fallback response
      res.json({
        recommendations: recommendations.trending_properties || [],
        total_count: recommendations.total_count || 0,
        type: 'guest-recommendations-trending-fallback'
      });
    }
  } catch (error: any) {
    logger.error('Error in getGuestRecommendations:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getContentBasedRecommendations = async (req: Request, res: Response) => {
  try {
    const { user_id, n = 5 } = req.query;
    
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    const data = await recommenderService.getContentBasedRecommendations(user_id, Number(n));
    res.json(data);
  } catch (error: any) {
    logger.error('Error in getContentBasedRecommendations:', error);
    res.status(500).json({ error: error.message });
  }
};