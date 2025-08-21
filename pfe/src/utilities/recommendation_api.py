from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from enhanced_recommender import PropertyRecommendationEngine
import logging
import os
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global recommendation engine instance
recommendation_engine = None

def initialize_engine():
    """Initialize the recommendation engine"""
    global recommendation_engine
    try:
        recommendation_engine = PropertyRecommendationEngine()
        
        # Load data
        if not recommendation_engine.load_data():
            raise Exception("Failed to load data")
        
        # Prepare content features
        if not recommendation_engine.prepare_content_features():
            raise Exception("Failed to prepare content features")
        
        logger.info("Recommendation engine initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing recommendation engine: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'recommendation-api',
        'engine_ready': recommendation_engine is not None
    })

@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Get personalized recommendations for a user"""
    try:
        user_id = request.args.get('user_id')
        rec_type = request.args.get('type', 'hybrid')
        n = int(request.args.get('n', 5))
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        if not recommendation_engine:
            return jsonify({'error': 'Recommendation engine not initialized'}), 500
        
        # Check if user exists in synthetic data
        mapped_user_id = user_id
        if user_id not in recommendation_engine.rating_matrix.index:
            # Try to map real user ID to synthetic user ID
            if len(user_id) == 24:  # MongoDB ObjectId length
                mapped_user_id = recommendation_engine.map_real_user_to_synthetic(user_id)
                if mapped_user_id:
                    logger.info(f"Using mapped user ID: {mapped_user_id} for real user: {user_id}")
                else:
                    logger.warning(f"Failed to map user {user_id}, falling back to trending properties")
            
            if not mapped_user_id or mapped_user_id not in recommendation_engine.rating_matrix.index:
                logger.warning(f"User {user_id} not found in synthetic data, falling back to trending properties")
                # Return trending properties instead of error
                trending_recs = recommendation_engine.get_trending_properties(n)
                
                # Build response with property details
                results = []
                for prop_id, score in trending_recs:
                    prop_details = recommendation_engine.get_property_details(prop_id)
                    if prop_details:
                        results.append({
                            'property_id': prop_id,
                            'score': score,
                            'type': prop_details['type'],
                            'price': prop_details['price'],
                            'location': prop_details['location'],
                            'bedrooms': prop_details['bedrooms'],
                            'bathrooms': prop_details['bathrooms'],
                            'reason': 'trending'
                        })
                
                return jsonify({
                    'user_id': user_id,
                    'type': 'trending_fallback',
                    'recommendations': results,
                    'total_count': len(results)
                })
        
        # Get recommendations based on type using mapped user ID
        if rec_type == 'collaborative':
            recs = recommendation_engine.collaborative_filtering(mapped_user_id, n)
            recs = list(recs.items())
        elif rec_type == 'content':
            recs = recommendation_engine.content_based_filtering(mapped_user_id, n)
            recs = list(recs.items())
        elif rec_type == 'hybrid':
            recs = recommendation_engine.hybrid_recommendations(mapped_user_id, n)
        else:
            return jsonify({'error': 'Invalid recommendation type. Use: collaborative, content, or hybrid'}), 400
        
        # Build response with property details
        results = []
        for prop_id, score in recs:
            prop_info = recommendation_engine.df_properties[
                recommendation_engine.df_properties['property_id'] == prop_id
            ]
            
            if not prop_info.empty:
                prop_data = prop_info.iloc[0]
                results.append({
                    'property_id': prop_id,
                    'score': round(float(score), 3),
                    'type': prop_data['type'],
                    'price': int(prop_data['price']),
                    'location': prop_data['location'],
                    'bedrooms': int(prop_data['bedrooms']),
                    'bathrooms': int(prop_data['bathrooms'])
                })
        
        return jsonify({
            'user_id': user_id,
            'type': rec_type,
            'recommendations': results,
            'total_count': len(results)
        })
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/similar-properties', methods=['GET'])
def get_similar_properties():
    """Get similar properties based on content similarity"""
    try:
        property_id = request.args.get('property_id')
        n = int(request.args.get('n', 5))
        
        if not property_id:
            return jsonify({'error': 'property_id is required'}), 400
        
        if not recommendation_engine:
            return jsonify({'error': 'Recommendation engine not initialized'}), 500
        
        # Get similar properties
        similar_props = recommendation_engine.get_similar_properties(property_id, n)
        
        if not similar_props:
            return jsonify({
                'property_id': property_id,
                'similar_properties': [],
                'message': 'No similar properties found'
            })
        
        # Build response with property details
        results = []
        for prop_id, score in similar_props:
            prop_info = recommendation_engine.df_properties[
                recommendation_engine.df_properties['property_id'] == prop_id
            ]
            
            if not prop_info.empty:
                prop_data = prop_info.iloc[0]
                results.append({
                    'property_id': prop_id,
                    'similarity_score': round(float(score), 3),
                    'type': prop_data['type'],
                    'price': int(prop_data['price']),
                    'location': prop_data['location'],
                    'bedrooms': int(prop_data['bedrooms']),
                    'bathrooms': int(prop_data['bathrooms'])
                })
        
        return jsonify({
            'property_id': property_id,
            'similar_properties': results,
            'total_count': len(results)
        })
        
    except Exception as e:
        logger.error(f"Error getting similar properties: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/user-preferences', methods=['GET'])
def get_user_preferences():
    """Get user preferences based on interaction history"""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        if not recommendation_engine:
            return jsonify({'error': 'Recommendation engine not initialized'}), 500
        
        # Get user interactions
        user_interactions = recommendation_engine.df_interactions[
            recommendation_engine.df_interactions['user_id'] == user_id
        ]
        
        if user_interactions.empty:
            return jsonify({
                'user_id': user_id,
                'preferences': {},
                'message': 'No interaction history found'
            })
        
        # Analyze preferences
        property_ids = user_interactions['property_id'].unique()
        user_properties = recommendation_engine.df_properties[
            recommendation_engine.df_properties['property_id'].isin(property_ids)
        ]
        
        preferences = {
            'favorite_types': user_properties['type'].value_counts().to_dict(),
            'favorite_locations': user_properties['location'].value_counts().to_dict(),
            'avg_price_range': {
                'min': int(user_properties['price'].min()),
                'max': int(user_properties['price'].max()),
                'avg': int(user_properties['price'].mean())
            },
            'bedroom_preference': user_properties['bedrooms'].mode().iloc[0] if not user_properties['bedrooms'].empty else None,
            'bathroom_preference': user_properties['bathrooms'].mode().iloc[0] if not user_properties['bathrooms'].empty else None,
            'avg_rating': float(user_interactions['rating'].mean()),
            'interaction_count': len(user_interactions)
        }
        
        return jsonify({
            'user_id': user_id,
            'preferences': preferences
        })
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/trending-properties', methods=['GET'])
def get_trending_properties():
    """Get trending properties based on interaction patterns"""
    try:
        n = int(request.args.get('n', 10))
        
        if not recommendation_engine:
            return jsonify({'error': 'Recommendation engine not initialized'}), 500
        
        # Calculate trending score based on interactions
        property_interactions = recommendation_engine.df_interactions.groupby('property_id').agg({
            'rating': ['mean', 'count'],
            'interaction_type': 'count'
        }).reset_index()
        
        # Flatten column names
        property_interactions.columns = ['property_id', 'avg_rating', 'rating_count', 'total_interactions']
        
        # Calculate trending score (weighted by both rating and interaction count)
        property_interactions['trending_score'] = (
            property_interactions['avg_rating'] * 0.7 + 
            (property_interactions['total_interactions'] / property_interactions['total_interactions'].max()) * 5 * 0.3
        )
        
        # Get top trending properties
        trending = property_interactions.nlargest(n, 'trending_score')
        
        # Build response with property details
        results = []
        for _, row in trending.iterrows():
            prop_id = row['property_id']
            prop_info = recommendation_engine.df_properties[
                recommendation_engine.df_properties['property_id'] == prop_id
            ]
            
            if not prop_info.empty:
                prop_data = prop_info.iloc[0]
                results.append({
                    'property_id': prop_id,
                    'trending_score': round(float(row['trending_score']), 3),
                    'avg_rating': round(float(row['avg_rating']), 2),
                    'interaction_count': int(row['total_interactions']),
                    'type': prop_data['type'],
                    'price': int(prop_data['price']),
                    'location': prop_data['location'],
                    'bedrooms': int(prop_data['bedrooms']),
                    'bathrooms': int(prop_data['bathrooms'])
                })
        
        return jsonify({
            'trending_properties': results,
            'total_count': len(results)
        })
        
    except Exception as e:
        logger.error(f"Error getting trending properties: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/reload-data', methods=['POST'])
def reload_data():
    """Reload recommendation data (for development/testing)"""
    try:
        if initialize_engine():
            return jsonify({'message': 'Data reloaded successfully'})
        else:
            return jsonify({'error': 'Failed to reload data'}), 500
    except Exception as e:
        logger.error(f"Error reloading data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize the recommendation engine
    if not initialize_engine():
        logger.error("Failed to initialize recommendation engine. Exiting.")
        sys.exit(1)
    
    # Run the Flask app
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    logger.info(f"Starting recommendation API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
