import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PropertyRecommendationEngine:
    def __init__(self):
        self.df_users = None
        self.df_properties = None
        self.df_interactions = None
        self.rating_matrix = None
        self.property_features = None
        self.tfidf_vectorizer = None
        self.scaler = StandardScaler()
        
    def load_data(self, users_file='synthetic_users.csv', properties_file='synthetic_properties.csv', 
                  interactions_file='synthetic_interactions.csv'):
        """Load data from CSV files"""
        try:
            self.df_users = pd.read_csv(users_file)
            self.df_properties = pd.read_csv(properties_file)
            self.df_interactions = pd.read_csv(interactions_file)
            
            # Create user-item rating matrix
            self.rating_matrix = self.df_interactions.pivot_table(
                index='user_id', 
                columns='property_id', 
                values='rating'
            )
            
            logger.info(f"Loaded {len(self.df_users)} users, {len(self.df_properties)} properties, {len(self.df_interactions)} interactions")
            return True
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            return False
    
    def prepare_content_features(self):
        """Prepare content-based features from property data"""
        try:
            # Create feature matrix for content-based filtering
            features = []
            
            # Property type (one-hot encoded)
            property_types = pd.get_dummies(self.df_properties['type'], prefix='type')
            
            # Location (one-hot encoded)
            locations = pd.get_dummies(self.df_properties['location'], prefix='location')
            
            # Numerical features (normalized)
            numerical_features = self.df_properties[['price', 'bedrooms', 'bathrooms']].copy()
            numerical_features_scaled = pd.DataFrame(
                self.scaler.fit_transform(numerical_features),
                columns=numerical_features.columns
            )
            
            # Combine all features
            self.property_features = pd.concat([
                property_types,
                locations,
                numerical_features_scaled
            ], axis=1)
            
            self.property_features.index = self.df_properties['property_id']
            
            logger.info(f"Prepared {self.property_features.shape[1]} content features")
            return True
        except Exception as e:
            logger.error(f"Error preparing content features: {e}")
            return False
    
    def collaborative_filtering(self, user_id, n=5):
        """Collaborative filtering recommendations"""
        try:
            if user_id not in self.rating_matrix.index:
                logger.warning(f"User {user_id} not found in rating matrix")
                return {}
            
            # Fill missing values with 0
            filled_matrix = self.rating_matrix.fillna(0)
            
            # Calculate user similarity
            user_idx = self.rating_matrix.index.get_loc(user_id)
            user_vector = filled_matrix.iloc[user_idx].values.reshape(1, -1)
            
            # Calculate cosine similarity with all users
            similarities = cosine_similarity(user_vector, filled_matrix)[0]
            
            # Get similar users (excluding self)
            similar_users_idx = np.argsort(similarities)[::-1][1:]
            similar_users = filled_matrix.index[similar_users_idx]
            
            # Get unrated properties for the target user
            unrated_properties = self.rating_matrix.loc[user_id][
                self.rating_matrix.loc[user_id].isna()
            ].index
            
            # Calculate predicted ratings
            scores = {}
            for prop in unrated_properties:
                weighted_sum = 0
                sim_sum = 0
                
                for sim_user, sim_score in zip(similar_users, similarities[similar_users_idx]):
                    if sim_score > 0:  # Only consider positive similarities
                        rating = self.rating_matrix.loc[sim_user, prop]
                        if not pd.isna(rating):
                            weighted_sum += sim_score * rating
                            sim_sum += sim_score
                
                if sim_sum > 0:
                    scores[prop] = weighted_sum / sim_sum
            
            # Return top N recommendations
            top_n = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
            return dict(top_n)
            
        except Exception as e:
            logger.error(f"Error in collaborative filtering: {e}")
            return {}
    
    def content_based_filtering(self, user_id, n=5):
        """Content-based filtering recommendations"""
        try:
            # Get user's interaction history
            user_interactions = self.df_interactions[
                self.df_interactions['user_id'] == user_id
            ]
            
            if user_interactions.empty:
                logger.warning(f"No interactions found for user {user_id}")
                return {}
            
            # Get properties the user has interacted with
            interacted_properties = user_interactions['property_id'].unique()
            
            # Calculate user profile based on interacted properties
            user_profile = np.zeros(self.property_features.shape[1], dtype=np.float64)
            total_weight = 0.0
            
            for prop_id in interacted_properties:
                if prop_id in self.property_features.index:
                    # Weight by rating (higher ratings = more influence)
                    rating = user_interactions[
                        user_interactions['property_id'] == prop_id
                    ]['rating'].mean()
                    
                    weight = float(rating) / 5.0  # Normalize to 0-1 and ensure float
                    # Ensure property features are numeric
                    prop_features = self.property_features.loc[prop_id].values.astype(np.float64)
                    user_profile += weight * prop_features
                    total_weight += weight
            
            if total_weight > 0:
                user_profile = user_profile / total_weight
            
            # Ensure property features matrix is numeric
            property_features_matrix = self.property_features.values.astype(np.float64)
            
            # Find similar properties
            similarities = cosine_similarity(
                user_profile.reshape(1, -1),
                property_features_matrix
            )[0]
            
            # Get properties not yet interacted with
            uninteracted_properties = self.df_properties[
                ~self.df_properties['property_id'].isin(interacted_properties)
            ]
            
            # Calculate scores for uninteracted properties
            scores = {}
            for idx, prop_id in enumerate(self.property_features.index):
                if prop_id in uninteracted_properties['property_id'].values:
                    scores[prop_id] = similarities[idx]
            
            # Return top N recommendations
            top_n = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
            return dict(top_n)
            
        except Exception as e:
            logger.error(f"Error in content-based filtering: {e}")
            return {}
    
    def hybrid_recommendations(self, user_id, n=5, collab_weight=0.6, content_weight=0.4):
        """Hybrid recommendation combining collaborative and content-based filtering"""
        try:
            # Get recommendations from both methods
            collab_recs = self.collaborative_filtering(user_id, n * 2)
            content_recs = self.content_based_filtering(user_id, n * 2)
            
            # Combine recommendations
            all_properties = set(collab_recs.keys()) | set(content_recs.keys())
            
            if not all_properties:
                logger.warning(f"No recommendations found for user {user_id}")
                return []
            
            # Normalize scores
            max_collab = max(collab_recs.values()) if collab_recs else 1
            max_content = max(content_recs.values()) if content_recs else 1
            
            hybrid_scores = {}
            for prop_id in all_properties:
                collab_score = collab_recs.get(prop_id, 0) / max_collab
                content_score = content_recs.get(prop_id, 0) / max_content
                
                hybrid_scores[prop_id] = (
                    collab_weight * collab_score + 
                    content_weight * content_score
                )
            
            # Return top N recommendations
            top_n = sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)[:n]
            return top_n
            
        except Exception as e:
            logger.error(f"Error in hybrid recommendations: {e}")
            return []
    
    def get_similar_properties(self, property_id, n=5):
        """Get similar properties based on content similarity"""
        try:
            if property_id not in self.property_features.index:
                logger.warning(f"Property {property_id} not found")
                return []
            
            # Get property features
            prop_features = self.property_features.loc[property_id].values.reshape(1, -1)
            
            # Calculate similarity with all properties
            similarities = cosine_similarity(prop_features, self.property_features.values)[0]
            
            # Get most similar properties (excluding self)
            similar_indices = np.argsort(similarities)[::-1][1:n+1]
            similar_properties = []
            
            for idx in similar_indices:
                prop_id = self.property_features.index[idx]
                score = similarities[idx]
                similar_properties.append((prop_id, score))
            
            return similar_properties
            
        except Exception as e:
            logger.error(f"Error getting similar properties: {e}")
            return []
    
    def get_trending_properties(self, n=5):
        """Get trending properties based on popularity and ratings"""
        try:
            # Calculate popularity score (number of interactions + average rating)
            popularity_scores = self.df_interactions.groupby('property_id').agg({
                'rating': ['count', 'mean'],
                'interaction_type': lambda x: (x == 'view').sum()  # Number of views
            }).reset_index()
            
            # Flatten column names
            popularity_scores.columns = ['property_id', 'rating_count', 'avg_rating', 'view_count']
            
            # Fill NaN values
            popularity_scores['avg_rating'] = popularity_scores['avg_rating'].fillna(0)
            
            # Calculate trending score (weighted combination of views, ratings, and rating count)
            popularity_scores['trending_score'] = (
                0.4 * popularity_scores['view_count'] +
                0.3 * popularity_scores['rating_count'] +
                0.3 * popularity_scores['avg_rating']
            )
            
            # Sort by trending score and get top n
            trending = popularity_scores.nlargest(n, 'trending_score')
            
            # Return as list of tuples (property_id, score)
            return [(row['property_id'], row['trending_score']) 
                   for _, row in trending.iterrows()]
        
        except Exception as e:
            logger.error(f"Error getting trending properties: {e}")
            # Fallback: return first n properties
            return [(prop_id, 1.0) for prop_id in self.df_properties['property_id'].head(n)]
    
    def get_property_details(self, property_id):
        """Get detailed property information for a single property"""
        try:
            prop_info = self.df_properties[
                self.df_properties['property_id'] == property_id
            ]
            if not prop_info.empty:
                return prop_info.iloc[0].to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting property details for {property_id}: {e}")
            return None

    def get_property_details(self, property_ids):
        """Get detailed property information"""
        try:
            details = []
            for prop_id in property_ids:
                prop_info = self.df_properties[
                    self.df_properties['property_id'] == prop_id
                ]
                if not prop_info.empty:
                    details.append(prop_info.iloc[0].to_dict())
            return details
        except Exception as e:
            logger.error(f"Error getting property details: {e}")
            return []

    def map_real_user_to_synthetic(self, real_user_id):
        """Map a real user ID to a synthetic user ID for testing"""
        try:
            # Simple hash-based mapping to ensure consistency
            import hashlib
            hash_value = int(hashlib.md5(real_user_id.encode()).hexdigest(), 16)
            synthetic_user_index = hash_value % len(self.rating_matrix.index)
            synthetic_user_id = self.rating_matrix.index[synthetic_user_index]
            
            logger.info(f"Mapped real user {real_user_id} to synthetic user {synthetic_user_id}")
            return synthetic_user_id
        except Exception as e:
            logger.error(f"Error mapping user ID: {e}")
            return None

def main():
    """Main function for testing"""
    engine = PropertyRecommendationEngine()
    
    # Load data
    if not engine.load_data():
        return
    
    # Prepare content features
    if not engine.prepare_content_features():
        return
    
    # Get user_id from command line or use first user
    user_id = sys.argv[1] if len(sys.argv) > 1 else engine.rating_matrix.index[0]
    
    print(f"Generating recommendations for user: {user_id}")
    
    # Get recommendations
    collaborative = engine.collaborative_filtering(user_id, n=5)
    content_based = engine.content_based_filtering(user_id, n=5)
    hybrid = engine.hybrid_recommendations(user_id, n=5)
    
    # Print results
    print("\n=== Collaborative Filtering ===")
    for prop_id, score in collaborative.items():
        prop_info = engine.df_properties[engine.df_properties['property_id'] == prop_id].iloc[0]
        print(f"Property: {prop_id}, Score: {score:.3f}, Type: {prop_info['type']}, Price: {prop_info['price']}, Location: {prop_info['location']}")
    
    print("\n=== Content-Based Filtering ===")
    for prop_id, score in content_based.items():
        prop_info = engine.df_properties[engine.df_properties['property_id'] == prop_id].iloc[0]
        print(f"Property: {prop_id}, Score: {score:.3f}, Type: {prop_info['type']}, Price: {prop_info['price']}, Location: {prop_info['location']}")
    
    print("\n=== Hybrid Recommendations ===")
    for prop_id, score in hybrid:
        prop_info = engine.df_properties[engine.df_properties['property_id'] == prop_id].iloc[0]
        print(f"Property: {prop_id}, Score: {score:.3f}, Type: {prop_info['type']}, Price: {prop_info['price']}, Location: {prop_info['location']}")

if __name__ == '__main__':
    main()
