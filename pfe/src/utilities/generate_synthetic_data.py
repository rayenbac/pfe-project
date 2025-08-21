import pandas as pd
import numpy as np
import random

# Parameters
NUM_USERS = 100
NUM_PROPERTIES = 50
NUM_INTERACTIONS = 1000

# Generate users
def generate_users(num_users):
    users = []
    for i in range(num_users):
        users.append({
            'user_id': f'user_{i+1}',
            'age': np.random.randint(18, 70),
            'location': random.choice(['CityA', 'CityB', 'CityC', 'CityD']),
            'user_type': random.choice(['buyer', 'renter', 'agent'])
        })
    return pd.DataFrame(users)

# Generate properties
def generate_properties(num_properties):
    properties = []
    for i in range(num_properties):
        properties.append({
            'property_id': f'property_{i+1}',
            'type': random.choice(['apartment', 'house', 'villa', 'studio']),
            'price': np.random.randint(50000, 1000000),
            'location': random.choice(['CityA', 'CityB', 'CityC', 'CityD']),
            'bedrooms': np.random.randint(1, 6),
            'bathrooms': np.random.randint(1, 4)
        })
    return pd.DataFrame(properties)

# Generate interactions (e.g., ratings)
def generate_interactions(users, properties, num_interactions):
    interactions = []
    for _ in range(num_interactions):
        user = users.sample(1).iloc[0]
        property_ = properties.sample(1).iloc[0]
        interactions.append({
            'user_id': user['user_id'],
            'property_id': property_['property_id'],
            'rating': np.random.randint(1, 6),  # 1 to 5 stars
            'interaction_type': random.choice(['view', 'favorite', 'contact'])
        })
    return pd.DataFrame(interactions)

if __name__ == '__main__':
    users_df = generate_users(NUM_USERS)
    properties_df = generate_properties(NUM_PROPERTIES)
    interactions_df = generate_interactions(users_df, properties_df, NUM_INTERACTIONS)

    # Save to CSV
    users_df.to_csv('synthetic_users.csv', index=False)
    properties_df.to_csv('synthetic_properties.csv', index=False)
    interactions_df.to_csv('synthetic_interactions.csv', index=False)

    print('Synthetic data generated and saved as CSV files.') 