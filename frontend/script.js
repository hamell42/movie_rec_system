document.addEventListener('DOMContentLoaded', () => {
    // Selectors for each category section
    const sections = {
        similar: document.querySelector('.category:nth-child(1) .movie-list'),
        genre: document.querySelector('.category:nth-child(2) .movie-list'),
        cast: document.querySelector('.category:nth-child(3) .movie-list'),
        keywords: document.querySelector('.category:nth-child(4) .movie-list'),
    };

    // Fetch recommendations from the backend
    fetch('http://127.0.0.1:5000/api/recommendations') // Replace with your API endpoint
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Process the data and update the HTML
            data.forEach((movie, index) => {
                movie = movie[0]
                console.log(index)
                console.log(movie['date'])
                genres = 'PLACE HOLDER'
                
                // Create a movie card
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.onclick = () => showMovieDetails(movie);
                // <p>⭐ ${movie['rating'].toFixed(1)} | ${genres.join(', ')}</p>
                card.innerHTML = `
                    <img src="${movie['poster'] || 'default-image.jpg'}" alt="${movie['name']}">
                    <p>${movie['name']}</p>
                    <p>⭐ ${movie['rating'].toFixed(1)}}</p>
                `;

                // Distribute movies into categories
                if (index < 10) {
                    sections.similar.appendChild(card);
                } else if (index < 20) {
                    sections.genre.appendChild(card);
                } else if (index < 30) {
                    sections.cast.appendChild(card);
                } else {
                    sections.keywords.appendChild(card);
                }
            });
        })
        .catch(error => console.error('Error fetching movie data:', error));
});

function showMovieDetails(movie) {
    // Fetch movie details from backend if needed (extend API if required)
    // For simplicity, use movieId to populate details (you can preload data)
    console.log(movie)
    document.getElementById('movie-modal').style.display = 'block';
    const posterElement = document.getElementById('movie-poster');
    if (posterElement) {
        posterElement.src = movie['poster']; // Set the image source
    }
    document.getElementById('movie-title').innerText = `Movie Title: ${movie['name']}`;
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
    alert(`Rating submitted: ${rating} stars`);
    closeModal();
}
