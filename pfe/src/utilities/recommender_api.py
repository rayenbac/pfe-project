from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from simple_recommender import collaborative_recommendations, content_based_recommendations, hybrid_recommendations

app = Flask(__name__)

# Load data once at startup
df_users = pd.read_csv('synthetic_users.csv')
df_properties = pd.read_csv('synthetic_properties.csv')
df_interactions = pd.read_csv('synthetic_interactions.csv')
rating_matrix = df_interactions.pivot_table(index='user_id', columns='property_id', values='rating')

@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    user_id = request.args.get('user_id')
    rec_type = request.args.get('type', 'hybrid')
    n = int(request.args.get('n', 5))
    if user_id is None:
        return jsonify({'error': 'user_id is required'}), 400
    if user_id not in rating_matrix.index:
        return jsonify({'error': f'user_id {user_id} not found'}), 404
    if rec_type == 'collaborative':
        recs = collaborative_recommendations(user_id, rating_matrix, n)
    elif rec_type == 'content':
        recs = content_based_recommendations(user_id, n)
    else:
        recs = dict(hybrid_recommendations(user_id, n))
    # Build response with property details
    results = []
    for prop_id, score in recs.items():
        prop_info = df_properties[df_properties['property_id'] == prop_id].iloc[0]
        results.append({
            'property_id': prop_id,
            'score': round(score, 2),
            'type': prop_info['type'],
            'price': int(prop_info['price']),
            'location': prop_info['location']
        })
    return jsonify({'user_id': user_id, 'type': rec_type, 'recommendations': results})

if __name__ == '__main__':
    app.run(debug=True) 