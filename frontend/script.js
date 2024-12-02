document.addEventListener('DOMContentLoaded', () => {
    // Selectors for each category section
    const sections = {
        similar: document.querySelector('.category:nth-child(1) .movie-list'),
        genre: document.querySelector('.category:nth-child(2) .movie-list'),
        cast: document.querySelector('.category:nth-child(3) .movie-list'),
    };
    const username = localStorage.getItem('username')
    const selectedGenre = 'Comedy';
    // Fetch recommendations from the backend
    fetch(`http://127.0.0.1:5000/api/recommendations?username=${encodeURIComponent(username)}&genre=${encodeURIComponent(selectedGenre)}`) // Replace with your API endpoint
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Process the data and update the HTML
            data.forEach((movie, index) => {
                movie = movie[0]
                
                // Create a movie card
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.onclick = () => showMovieDetails(movie);
                // <p>⭐ ${movie['rating'].toFixed(1)} | ${genres.join(', ')}</p>
                card.innerHTML = `
                    <img src="${movie['poster'] || 'default-image.jpg'}" alt="${movie['name']}">
                    <h1>${movie['name']}</h1>
                    <p>⭐ ${movie['rating'].toFixed(1)}</p>
                `;

                // Distribute movies into categories
                if (index < 10) {
                    sections.similar.appendChild(card);
                } else if (index < 20) {
                    sections.genre.appendChild(card);
                } else if (index < 30) {
                    sections.cast.appendChild(card);
                }
            });
        })
        .catch(error => console.error('Error fetching movie data:', error));
});

document.addEventListener("DOMContentLoaded", () => {
    const genreSelect = document.getElementById('movie-genres');

    // Fetch genres from the Python backend
    fetch('http://127.0.0.1:5000/api/genres')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(genres => {
            // Populate the dropdown with fetched genres
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre; // Use lowercase for values
                option.textContent = genre; // Display name in title case
                genreSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
});

function genreFilter(){
    // Selectors for each category section
    const sections = {
        similar: document.querySelector('.category:nth-child(1) .movie-list'),
        genre: document.querySelector('.category:nth-child(2) .movie-list'),
        cast: document.querySelector('.category:nth-child(3) .movie-list'),
    };

    // Clear existing cards from all sections
    sections.genre.innerHTML = '';

    const username = localStorage.getItem('username')
    const selectedGenre = document.getElementById('movie-genres').value;
    // Fetch recommendations from the backend
    fetch(`http://127.0.0.1:5000/api/recommendations?username=${encodeURIComponent(username)}&genre=${encodeURIComponent(selectedGenre)}`) // Replace with your API endpoint
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Process the data and update the HTML
            data.forEach((movie, index) => {
                movie = movie[0]
                
                // Create a movie card
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.onclick = () => showMovieDetails(movie);
                // <p>⭐ ${movie['rating'].toFixed(1)} | ${genres.join(', ')}</p>
                card.innerHTML = `
                    <img src="${movie['poster'] || 'default-image.jpg'}" alt="${movie['name']}">
                    <h1>${movie['name']}</h1>
                    <p>⭐ ${movie['rating'].toFixed(1)}</p>
                `;

                // Distribute movies into categories
                if (index < 20 && index >= 10) {
                    sections.genre.appendChild(card);
                }
            });
        })
        .catch(error => console.error('Error fetching movie data:', error));
}

function showMovieDetails(movie) {
    // Fetch movie details from backend if needed (extend API if required)
    // For simplicity, use movieId to populate details (you can preload data)
    console.log(movie)
    document.getElementById('movie-modal').style.display = 'block';
    document.getElementById('movie-id').innerText = `${movie['id']}`;
    document.getElementById('movie-id').style.display = 'none';
    const posterElement = document.getElementById('movie-poster');
    if (posterElement) {
        posterElement.src = movie['poster']; // Set the image source
    }
    document.getElementById('movie-title').innerText = `${movie['name']}`;
    if (movie['description'] != 0) {
        document.getElementById('movie-description').innerText = `${movie['description']}`;
    }
    if (movie['runtime'] != 0){
        document.getElementById('movie-runtime').innerText = `Runtime: ${movie['minute']} minutes`;
    }
}

// Close the modal
function closeModal() {
    document.getElementById('movie-modal').style.display = 'none';
}

// Submit rating function (to be connected to the backend)
function submitRating() {
    const rating = document.getElementById('rating').value;
    const movieId = document.getElementById('movie-id').innerText;
    const userId = localStorage.getItem('username');
    // Prepare the payload
    const payload = {
        user_id: userId,
        movie_id: movieId,
        rating: rating
    };

    // Send the data to the backend
    fetch('http://127.0.0.1:5000/api/submit_rating', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then(response => {
            if (response.ok) {
                alert(`Rating submitted: ${rating} stars`);
                closeModal();
            } else {
                alert('Error submitting rating');
            }
        })
        .catch(error => console.error('Error:', error)); 
}
