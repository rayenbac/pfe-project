import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import sys

# Load synthetic data
df_users = pd.read_csv('synthetic_users.csv')
df_properties = pd.read_csv('synthetic_properties.csv')
df_interactions = pd.read_csv('synthetic_interactions.csv')

# Create user-item rating matrix
rating_matrix = df_interactions.pivot_table(index='user_id', columns='property_id', values='rating')

# --- Collaborative Filtering ---
def collaborative_recommendations(user_id, rating_matrix, n=5):
    if user_id not in rating_matrix.index:
        print(f"User {user_id} not found.")
        return []
    filled_matrix = rating_matrix.fillna(0)
    user_idx = rating_matrix.index.get_loc(user_id)
    user_vector = filled_matrix.iloc[user_idx].values.reshape(1, -1)
    similarities = cosine_similarity(user_vector, filled_matrix)[0]
    similar_users_idx = np.argsort(similarities)[::-1][1:]
    similar_users = filled_matrix.index[similar_users_idx]
    unrated_properties = rating_matrix.loc[user_id][rating_matrix.loc[user_id].isna()].index
    scores = {}
    for prop in unrated_properties:
        weighted_sum = 0
        sim_sum = 0
        for sim_user, sim_score in zip(similar_users, similarities[similar_users_idx]):
            rating = rating_matrix.loc[sim_user, prop]
            if not np.isnan(rating):
                weighted_sum += sim_score * rating
                sim_sum += sim_score
        if sim_sum > 0:
            scores[prop] = weighted_sum / sim_sum
    top_n = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
    return dict(top_n)

# --- Content-Based Filtering ---
def content_based_recommendations(user_id, n=5):
    # Get properties the user has interacted with
    user_interactions = df_interactions[df_interactions['user_id'] == user_id]
    if user_interactions.empty:
        return {}
    # Get the most common property type/location the user interacted with
    favorite_type = user_interactions['property_id'].map(
        df_properties.set_index('property_id')['type']
    ).mode()[0]
    favorite_location = user_interactions['property_id'].map(
        df_properties.set_index('property_id')['location']
    ).mode()[0]
    # Recommend unrated properties matching these features
    rated_props = set(user_interactions['property_id'])
    candidates = df_properties[
        (~df_properties['property_id'].isin(rated_props)) &
        ((df_properties['type'] == favorite_type) | (df_properties['location'] == favorite_location))
    ]
    # Score: 1 if both match, 0.5 if one matches
    scores = {}
    for _, row in candidates.iterrows():
        score = 0
        if row['type'] == favorite_type:
            score += 0.5
        if row['location'] == favorite_location:
            score += 0.5
        scores[row['property_id']] = score
    top_n = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
    return dict(top_n)

# --- Hybrid Recommender ---
def hybrid_recommendations(user_id, n=5):
    collab = collaborative_recommendations(user_id, rating_matrix, n*2)
    content = content_based_recommendations(user_id, n*2)
    # Combine scores (normalize to 0-1)
    all_props = set(collab.keys()) | set(content.keys())
    if not all_props:
        return []
    max_collab = max(collab.values()) if collab else 1
    max_content = max(content.values()) if content else 1
    hybrid_scores = {}
    for prop in all_props:
        c_score = collab.get(prop, 0) / max_collab
        cb_score = content.get(prop, 0) / max_content
        hybrid_scores[prop] = (c_score + cb_score) / 2
    top_n = sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)[:n]
    return top_n

# --- Utility to print recommendations ---
def print_recommendations(user_id, recs, title):
    print(f"\n{title} for {user_id}:")
    for prop, score in recs:
        prop_info = df_properties[df_properties['property_id'] == prop].iloc[0]
        print(f"Property: {prop}, Score: {score:.2f}, Type: {prop_info['type']}, Price: {prop_info['price']}, Location: {prop_info['location']}")

if __name__ == '__main__':
    # Get user_id from command line or use first user
    user_id = sys.argv[1] if len(sys.argv) > 1 else rating_matrix.index[0]
    print(f"Generating recommendations for user: {user_id}")
    collab = list(collaborative_recommendations(user_id, rating_matrix, n=5).items())
    content = list(content_based_recommendations(user_id, n=5).items())
    hybrid = hybrid_recommendations(user_id, n=5)
    print_recommendations(user_id, collab, "Collaborative Filtering Recommendations")
    print_recommendations(user_id, content, "Content-Based Recommendations")
    print_recommendations(user_id, hybrid, "Hybrid Recommendations") 