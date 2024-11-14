import pandas as pd
from surprise import SVD, Dataset, Reader
from surprise.model_selection import train_test_split
import csv
import pickle

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

crew_df = pd.read_csv('../dataset/crew.csv', low_memory=False)
actors_df = pd.read_csv('../dataset/actors.csv', low_memory=False)
genres_df = pd.read_csv('../dataset/genres.csv', low_memory=False)
languages_df = pd.read_csv('../dataset/languages.csv', low_memory=False)
movies_df = pd.read_csv('../dataset/movies.csv', low_memory=False)
posters_df = pd.read_csv('../dataset/posters.csv', low_memory=False)
ratings_df = pd.read_csv('../dataset/ratings.csv', low_memory=False)

crew_df = crew_df.fillna(0, inplace=False)
actors_df = actors_df.fillna(0, inplace=False)
genres_df = genres_df.fillna(0, inplace=False)
languages_df = languages_df.fillna(0, inplace=False)
movies_df = movies_df.fillna(0, inplace=False)
posters_df = posters_df.fillna(0, inplace=False)
ratings_df = ratings_df.fillna(0, inplace=False)



# Ratings-Based Recommendation
# Load and prepare data
if ratings_df.size > 0:
    reader = Reader(rating_scale=(ratings_df['rating'].min(), ratings_df['rating'].max()))
    data = Dataset.load_from_df(ratings_df[['userId', 'movieId', 'rating']], reader)

    # Split data and train SVD model
    trainset, testset = train_test_split(data, test_size=0.2)
    svd = SVD()
    svd.fit(trainset)

    # Predict on test set
    predictions = svd.test(testset)

    # Save the model
    with open('svd_model.pkl', 'wb') as f:
        pickle.dump(svd, f)


@app.route('/submit_rating', methods=['POST'])
def submit_rating():
    data = request.json
    user_id = data.get('user_id')
    movie_id = data.get('movie_id')
    rating = data.get('rating')

    # Validate inputs
    if not all([user_id, movie_id, rating]):
        return jsonify({"error": "Missing data"}), 400
    
    with open('svd_model.pkl', 'rb') as f:
        svd = pickle.load(f)
    new_rating = {'userId': user_id, 'movieId': movie_id, 'rating':rating}
    ratings_df = pd.read_csv('../dataset/ratings.csv', low_memory=False)
    ratings_df = ratings_df.fillna(0, inplace=False)
    # Update the dataset and retrain the model
    data = Dataset.load_from_df(ratings_df[['userId', 'movieId', 'rating']], reader)
    trainset = data.build_full_trainset()
    svd.fit(trainset)

    # Save the updated model
    with open('svd_model.pkl', 'wb') as f:
        pickle.dump(svd, f)

    # Write to CSV
    try:
        with open("../dataset/ratings.csv", 'a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([user_id, movie_id, rating])
        return jsonify({"message": "Rating submitted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/recommendations', methods=['GET'])
def predict():
    with open('svd_model.pkl', 'rb') as f:
        svd = pickle.load(f)
    user_id = request.args.get('username', default='0', type=str)
    num_recommendations = 10
    top_recommendations = []

    if ratings_df.size > 0:
        # Get all movie IDs in the dataset
        all_movie_ids = movies_df.head(10000)['id'].unique()
        # Filter out movies the user has already rated
        rated_movies = ratings_df[ratings_df['userId'] == user_id]['movieId']
        unrated_movies = [movie for movie in all_movie_ids if movie not in rated_movies]

        # Predict ratings for each unrated movie
        predictions = [(movie_id, svd.predict(user_id, movie_id).est) for movie_id in unrated_movies]
        sorted_predictions = sorted(predictions, key=lambda x: x[1], reverse=True)

        predicted_ratings_df = pd.DataFrame(predictions, columns=['movieId', 'rating']).set_index('movieId')

        # Step 5: Get Top 5 Recommendations with Valid Titles
        for movie_id, predicted_rating in sorted_predictions:
            # Retrieve title
            movie = movies_df[movies_df['id'] == movie_id]
            title = movies_df[movies_df['id'] == movie_id]['name']
            poster = posters_df[posters_df['id'] == movie_id]['link']
            #genre = movies_df[genres_df['id'] == movie_id]['genre']
            
            # Check if the title exists and is not empty
            if not title.empty:
                json_obj = movie.to_dict(orient='records')
                json_obj[0]['poster'] = poster.values[0]
                top_recommendations.append(json_obj)
            
            # Stop once we have 5 valid recommendations
            if len(top_recommendations) == num_recommendations:
                break
        top_genres = genres_df[genres_df['id'] == top_recommendations[0][0]['id']]['genre']
        top_genres = top_genres.values

        for movie_id, predicted_rating in sorted_predictions:
            # Retrieve title
            movie = movies_df[movies_df['id'] == movie_id]
            title = movies_df[movies_df['id'] == movie_id]['name']
            poster = posters_df[posters_df['id'] == movie_id]['link']
            genre = genres_df[genres_df['id'] == movie_id]['genre']
            genre = genre.values
            # Check if the title exists and is not empty
            if not title.empty:
                id_exists = any(obj[0]['id'] == movie_id for obj in top_recommendations)
                if id_exists == False:
                    print('new id', title.values[0])
                    json_obj = movie.to_dict(orient='records')
                    json_obj[0]['poster'] = poster.values[0]
                    top_recommendations.append(json_obj)
            
            # Stop once we have 5 valid recommendations
            if len(top_recommendations) == (2*num_recommendations):
                break

        return jsonify(top_recommendations)
    else:
        top_recommendations = movies_df.sample(n=(4*num_recommendations)).values.tolist()
        return jsonify(top_recommendations)
    
if __name__ == '__main__':
    app.run(debug=True)