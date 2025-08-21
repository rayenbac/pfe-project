import axios from 'axios';
import { Property } from '../Models/property';
import { User } from '../Models/user';
import { Favorite } from '../Models/favorite';
import { Review } from '../Models/review';
import { diContainer } from '../DI/iversify.config';
import { PropertyService } from './property.service';
import { PropertyTYPES } from '../DI/Property/PropertyTypes';
import { injectable } from 'inversify';
import { logger } from '../Config/logger.config';

const FLASK_API_URL = 'http://127.0.0.1:5000';

export interface RecommendationItem {
  property_id: string;
  score: number;
  type: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
}

export interface RecommendationResponse {
  user_id: string;
  type: string;
  recommendations: RecommendationItem[];
  total_count: number;
}

export interface SimilarProperty {
  property_id: string;
  similarity_score: number;
  type: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
}

export interface SimilarPropertiesResponse {
  property_id?: string;
  similar_properties: SimilarProperty[];
  total_count?: number;
  message?: string;
}

@injectable()
export class RecommenderService {
  private propertyService: PropertyService;

  constructor() {
    this.propertyService = diContainer.get<PropertyService>(PropertyTYPES.propertyService);
  }

  async getRecommendations(user_id: string, type: string = 'hybrid', n: number = 5): Promise<RecommendationResponse> {
    try {
      const response = await axios.get(`${FLASK_API_URL}/recommendations`, {
        params: { user_id, type, n },
        timeout: 5000, // 5 second timeout
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching recommendations for user ${user_id}:`, error);
      
      // Return empty recommendations instead of throwing error to prevent crash
      return {
        recommendations: [],
        user_id: user_id,
        type: type,
        total_count: 0
      };
    }
  }

  async getSimilarProperties(property_id: string, n: number = 5): Promise<SimilarPropertiesResponse> {
    try {
      const response = await axios.get(`${FLASK_API_URL}/similar-properties`, {
        params: { property_id, n },
        timeout: 5000, // 5 second timeout
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching similar properties for ${property_id}:`, error);
      
      // Return empty response instead of throwing error to prevent crash
      return {
        similar_properties: [],
        total_count: 0,
        message: 'Recommendation service temporarily unavailable'
      };
    }
  }

  async getUserPreferences(user_id: string) {
    try {
      const response = await axios.get(`${FLASK_API_URL}/user-preferences`, {
        params: { user_id },
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching user preferences for ${user_id}:`, error);
      throw new Error(error.response?.data?.error || 'Failed to fetch user preferences');
    }
  }

  async getTrendingProperties(n: number = 10) {
    try {
      // Use database directly for consistent real data
      return this.getTrendingPropertiesFromDB(n);
    } catch (error: any) {
      logger.error('Error fetching trending properties:', error);
      throw new Error('Failed to fetch trending properties');
    }
  }

  async getTrendingPropertiesFromDB(n: number = 10) {
    try {
      const properties = await Property.find({ status: 'available' })
        .sort({ views: -1, favorites: -1, createdAt: -1 })
        .limit(n)
        .populate('owner', 'firstName lastName profileImage')
        .populate('listedBy', 'firstName lastName profileImage')
        .lean();

      const trending_properties = properties.map(prop => ({
        property_id: prop._id.toString(),
        property: prop,
        trending_score: (prop.views || 0) * 0.6 + (prop.favorites || 0) * 0.4,
        views: prop.views || 0,
        type: prop.type,
        price: prop.pricing?.price || 0,
        location: prop.address?.city || '',
        bedrooms: prop.bedrooms || 0,
        bathrooms: prop.bathrooms || 0
      }));

      return {
        trending_properties,
        total_count: trending_properties.length,
        type: 'trending-properties'
      };
    } catch (error: any) {
      logger.error('Error fetching trending properties from DB:', error);
      throw new Error('Failed to fetch trending properties');
    }
  }

  async getRecommendationsWithFullDetails(user_id: string, type: string = 'hybrid', n: number = 5) {
    try {
      // Get recommendations from Python API
      const recommendations = await this.getRecommendations(user_id, type, n);
      
      // Map synthetic property IDs to real property IDs
      const propertyIds = recommendations.recommendations.map(rec => rec.property_id);
      const realPropertyIds = this.mapSyntheticToRealPropertyIds(propertyIds);
      
      // Fetch full property details from MongoDB
      const fullProperties = await this.getPropertiesByIds(realPropertyIds);
      
      // Combine recommendation scores with full property details
      const enrichedRecommendations = recommendations.recommendations.map(rec => {
        const fullProperty = fullProperties.find(prop => prop._id.toString() === rec.property_id);
        return {
          ...rec,
          property: fullProperty || null
        };
      }).filter(rec => rec.property !== null);

      // If no real properties found, return recommendations with synthetic data
      if (enrichedRecommendations.length === 0) {
        return {
          ...recommendations,
          recommendations: recommendations.recommendations.map(rec => ({
            ...rec,
            property: null // Will be handled by frontend
          }))
        };
      }

      return {
        ...recommendations,
        recommendations: enrichedRecommendations
      };
    } catch (error: any) {
      logger.error(`Error getting recommendations with full details for ${user_id}:`, error);
      throw error;
    }
  }

  async getSimilarPropertiesWithFullDetails(property_id: string, n: number = 5) {
    try {
      // Get similar properties from Python API
      const similarProperties = await this.getSimilarProperties(property_id, n);
      
      // If recommendation service is unavailable, return empty result
      if (similarProperties.similar_properties.length === 0) {
        return {
          similar_properties: [],
          total_count: 0,
          message: 'Recommendation service temporarily unavailable'
        };
      }
      
      // Map synthetic property IDs to real property IDs
      const propertyIds = similarProperties.similar_properties.map(sim => sim.property_id);
      const realPropertyIds = this.mapSyntheticToRealPropertyIds(propertyIds);
      
      // Fetch full property details from MongoDB
      const fullProperties = await this.getPropertiesByIds(realPropertyIds);
      
      // Combine similarity scores with full property details
      const enrichedSimilarProperties = similarProperties.similar_properties.map(sim => {
        const fullProperty = fullProperties.find(prop => prop._id.toString() === sim.property_id);
        return {
          ...sim,
          property: fullProperty || null
        };
      }).filter(sim => sim.property !== null);

      // If no real properties found, return similar properties with synthetic data
      if (enrichedSimilarProperties.length === 0) {
        return {
          ...similarProperties,
          similar_properties: similarProperties.similar_properties.map(sim => ({
            ...sim,
            property: null // Will be handled by frontend
          }))
        };
      }

      return {
        ...similarProperties,
        similar_properties: enrichedSimilarProperties
      };
    } catch (error: any) {
      logger.error(`Error getting similar properties with full details for ${property_id}:`, error);
      
      // Return empty result instead of throwing error
      return {
        similar_properties: [],
        total_count: 0,
        message: 'Error fetching similar properties'
      };
    }
  }

  private mapSyntheticToRealPropertyIds(syntheticIds: string[]): string[] {
    // For now, return empty array for synthetic IDs
    // In a real system, you'd have a mapping table or use property details to find matches
    const realPropertyIds: string[] = [];
    
    syntheticIds.forEach(syntheticId => {
      // Check if it's already a real ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(syntheticId)) {
        realPropertyIds.push(syntheticId);
      } else {
        // For synthetic IDs, we can't map them directly to real properties
        // In a production system, you'd either:
        // 1. Sync real property data to the ML system
        // 2. Have a mapping table
        // 3. Use property features to find similar real properties
        logger.info(`Skipping synthetic property ID: ${syntheticId}`);
      }
    });

    return realPropertyIds;
  }

  private async getPropertiesByIds(propertyIds: string[]) {
    try {
      // Filter out invalid MongoDB ObjectIds (synthetic IDs from Python API)
      const validObjectIds = propertyIds.filter(id => {
        // Check if it's a valid MongoDB ObjectId (24 hex characters)
        return /^[0-9a-fA-F]{24}$/.test(id);
      });

      if (validObjectIds.length === 0) {
        logger.info('No valid ObjectIds found in property IDs:', propertyIds);
        return [];
      }

      const properties = await Property.find({
        _id: { $in: validObjectIds }
      }).populate('owner', 'firstName lastName email profileImage')
        .populate('listedBy', 'firstName lastName email profileImage')
        .exec();

      return properties;
    } catch (error: any) {
      logger.error('Error fetching properties by IDs:', error);
      throw new Error('Failed to fetch property details');
    }
  }

  async getContentBasedRecommendations(user_id: string, n: number = 5) {
    try {
      // Get user's favorites and interactions
      const favorites = await Favorite.find({ userId: user_id }).populate('properties');
      const reviews = await Review.find({ userId: user_id });
      
      if (favorites.length === 0 && reviews.length === 0) {
        // Return trending properties if no user data
        return await this.getTrendingProperties(n);
      }

      // Extract property features from user's favorites
      const favoritePropertyIds = favorites.flatMap(fav => fav.properties);
      const favoriteProperties = await Property.find({
        _id: { $in: favoritePropertyIds }
      });

      // Simple content-based filtering based on property type and location
      const userPreferences = this.analyzeUserPreferences(favoriteProperties);
      
      // Find similar properties
      const similarProperties = await Property.find({
        _id: { $nin: favoritePropertyIds },
        $or: [
          { type: { $in: userPreferences.preferredTypes } },
          { 'address.city': { $in: userPreferences.preferredLocations } }
        ]
      }).limit(n);

      return {
        user_id,
        type: 'content_based',
        recommendations: similarProperties.map(prop => ({
          property_id: prop._id.toString(),
          score: this.calculateContentScore(prop, userPreferences),
          property: prop
        }))
      };
    } catch (error: any) {
      logger.error(`Error getting content-based recommendations for ${user_id}:`, error);
      throw error;
    }
  }

  async getContentBasedRecommendationsFromDB(user_id: string, n: number = 5) {
    try {
      // Get user's favorites and reviews
      const favorites = await Favorite.find({ userId: user_id }).populate('properties');
      const reviews = await Review.find({ userId: user_id });
      
      if (favorites.length === 0 && reviews.length === 0) {
        // Return popular/trending properties if no user data
        const trendingProperties = await Property.find({
          status: 'available'
        })
        .sort({ views: -1, createdAt: -1 })
        .limit(n)
        .populate('owner', 'firstName lastName email profileImage')
        .populate('listedBy', 'firstName lastName email profileImage')
        .exec();

        return trendingProperties.map(prop => ({
          property_id: prop._id.toString(),
          score: 0.7,
          type: prop.type,
          price: prop.pricing.price,
          location: prop.address.city,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          property: prop
        }));
      }

      // Extract property features from user's favorites and reviews
      const favoritePropertyIds = favorites.flatMap(fav => fav.properties);
      const reviewPropertyIds = reviews
        .filter(review => review.targetType === 'property')
        .map(review => review.targetId);
      const allInteractedIds = [...favoritePropertyIds, ...reviewPropertyIds];

      const interactedProperties = await Property.find({
        _id: { $in: allInteractedIds }
      });

      // Analyze user preferences
      const userPreferences = this.analyzeUserPreferences(interactedProperties);
      
      // Find similar properties based on preferences
      const query: any = {
        _id: { $nin: allInteractedIds },
        status: 'available'
      };

      // Add preference-based filters
      const preferenceFilters = [];
      
      if (userPreferences.preferredTypes.length > 0) {
        preferenceFilters.push({ type: { $in: userPreferences.preferredTypes.slice(0, 3) } });
      }
      
      if (userPreferences.preferredLocations.length > 0) {
        preferenceFilters.push({ 'address.city': { $in: userPreferences.preferredLocations.slice(0, 3) } });
      }

      // Price range based on user's interaction history
      if (userPreferences.avgPrice > 0) {
        const priceRange = userPreferences.avgPrice * 0.3; // 30% range
        preferenceFilters.push({
          'pricing.price': {
            $gte: userPreferences.avgPrice - priceRange,
            $lte: userPreferences.avgPrice + priceRange
          }
        });
      }

      if (preferenceFilters.length > 0) {
        query.$or = preferenceFilters;
      }

      const recommendedProperties = await Property.find(query)
        .sort({ createdAt: -1, views: -1 })
        .limit(n)
        .populate('owner', 'firstName lastName email profileImage')
        .populate('listedBy', 'firstName lastName email profileImage')
        .exec();

      return recommendedProperties.map(prop => ({
        property_id: prop._id.toString(),
        score: this.calculateContentScore(prop, userPreferences),
        type: prop.type,
        price: prop.pricing.price,
        location: prop.address.city,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        property: prop
      }));

    } catch (error: any) {
      logger.error(`Error getting content-based recommendations from DB for ${user_id}:`, error);
      
      // Fallback to trending properties
      try {
        const fallbackProperties = await Property.find({ status: 'available' })
          .sort({ views: -1, createdAt: -1 })
          .limit(n)
          .populate('owner', 'firstName lastName email profileImage')
          .populate('listedBy', 'firstName lastName email profileImage')
          .exec();

        return fallbackProperties.map(prop => ({
          property_id: prop._id.toString(),
          score: 0.5,
          type: prop.type,
          price: prop.pricing.price,
          location: prop.address.city,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          property: prop
        }));
      } catch (fallbackError) {
        logger.error('Fallback to trending properties also failed:', fallbackError);
        return [];
      }
    }
  }

  async getGuestRecommendations(guestData: {
    preferences?: any;
    viewedProperties?: any[];
    userLocation?: any;
    limit: number;
  }) {
    try {
      const { preferences, viewedProperties = [], userLocation, limit } = guestData;
      
      let query: any = { status: 'available' }; // Restore status filter
      let sortCriteria: any = { createdAt: -1 };
      
      // Build smart query based on available data
      if (preferences) {
        if (preferences.preferredTypes?.length > 0) {
          query.type = { $in: preferences.preferredTypes };
        }
        
        if (preferences.preferredLocations?.length > 0) {
          query['address.city'] = { $in: preferences.preferredLocations };
        }
        
        if (preferences.priceRange) {
          query['pricing.price'] = {
            $gte: preferences.priceRange.min,
            $lte: preferences.priceRange.max
          };
        }
      }
      
      // Location-based filtering
      if (userLocation?.city) {
        if (!query['address.city']) {
          query['address.city'] = userLocation.city;
        }
      }
      
      // Exclude already viewed properties
      if (viewedProperties.length > 0) {
        const viewedIds = viewedProperties.map(vp => vp.id);
        query._id = { $nin: viewedIds };
      }
      
      let properties = await Property.find(query)
        .populate('owner', 'firstName lastName profileImage')
        .populate('listedBy', 'firstName lastName profileImage')
        .sort(sortCriteria)
        .limit(limit * 2)
        .lean();
      
      // If not enough, relax constraints
      if (properties.length < limit) {
        const relaxedQuery = { 
          status: 'available',
          _id: viewedProperties.length > 0 ? { $nin: viewedProperties.map(vp => vp.id) } : undefined
        };
        
        properties = await Property.find(relaxedQuery)
          .populate('owner', 'firstName lastName profileImage')
          .populate('listedBy', 'firstName lastName profileImage')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
      }
      
      // Score and return
      const scoredProperties = properties.map(property => ({
        property_id: property._id.toString(),
        property,
        score: this.calculateGuestScore(property, guestData),
        reason: 'Recommended for you'
      }));
      
      return scoredProperties
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      logger.error('Error in getGuestRecommendations:', error);
      return this.getTrendingPropertiesFromDB(guestData.limit);
    }
  }

  private calculateGuestScore(property: any, guestData: any): number {
    const { preferences, userLocation } = guestData;
    let score = 0.5;
    
    if (preferences) {
      if (preferences.preferredTypes?.includes(property.type)) {
        score += 0.2;
      }
      
      if (preferences.preferredLocations?.includes(property.address?.city)) {
        score += 0.2;
      }
    }
    
    if (userLocation?.city && property.address?.city === userLocation.city) {
      score += 0.15;
    }
    
    const daysSinceCreated = (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) {
      score += 0.1;
    }
    
    return Math.min(score, 1);
  }

  private analyzeUserPreferences(properties: any[]) {
    const types = properties.map(p => p.type);
    const locations = properties.map(p => p.address?.city).filter(Boolean);
    
    const typeCount = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationCount = locations.reduce((acc, location) => {
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      preferredTypes: Object.keys(typeCount).sort((a, b) => typeCount[b] - typeCount[a]),
      preferredLocations: Object.keys(locationCount).sort((a, b) => locationCount[b] - locationCount[a]),
      avgPrice: properties.reduce((sum, p) => sum + p.pricing.price, 0) / properties.length || 0
    };
  }

  private calculateContentScore(property: any, preferences: any): number {
    let score = 0;
    
    // Type preference
    if (preferences.preferredTypes.includes(property.type)) {
      score += 0.4;
    }
    
    // Location preference
    if (preferences.preferredLocations.includes(property.address?.city)) {
      score += 0.3;
    }
    
    // Price similarity
    if (preferences.avgPrice > 0) {
      const priceDiff = Math.abs(property.pricing.price - preferences.avgPrice);
      const priceScore = Math.max(0, 1 - (priceDiff / preferences.avgPrice));
      score += priceScore * 0.3;
    }
    
    return Math.min(score, 1);
  }
}

// Legacy function for backward compatibility
export async function getRecommendations(user_id: string, type: string = 'hybrid', n: number = 5) {
  const service = new RecommenderService();
  return await service.getRecommendations(user_id, type, n);
}