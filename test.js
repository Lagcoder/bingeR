const WORKER_URL = 'https://apisecure.lagcoder.workers.dev';

// --- User Profile Preferences ---
const userPreferences = {
  actors: { "Leonardo DiCaprio": 7.0, "Christian Bale": 6.5, "Cillian Murphy": 6.0 },
  directors: { "Christopher Nolan": 7.0, "Denis Villeneuve": 6.5 },
  genres: { "Sci-Fi": 6.5, "Thriller": 6.0, "Drama": 5.0 },
  keywords: { "mind-bending": 7.0, "space": 6.5, "dystopia": 6.0 }
};

// --- Fetch and Process Movies from Worker ---
async function fetchMovies() {
  try {
    const response = await fetch(`${WORKER_URL}/movie/popular`);
    const data = await response.json();
    
    // Support both direct array response and TMDB wrapped object ({ results: [...] })
    const rawList = Array.isArray(data) ? data : (data.results || []);
    return processApiMovies(rawList);
  } catch (error) {
    console.error('Failed to fetch movies from worker:', error);
    return [];
  }
}

// --- Map TMDB Payload to UI Model & Calculate Scores ---
function processApiMovies(rawList) {
  const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

  return rawList.map(item => {
    // TMDB vote_average is out of 10 -> halved to match the base scale
    const baseRating = item.vote_average ? item.vote_average / 2 : 0;

    const movie = {
      id: item.id,
      title: item.title || item.original_title || 'Untitled',
      year: item.release_date ? item.release_date.split('-')[0] : 'N/A',
      baseRating: baseRating,
      director: item.director || '',
      cast: item.cast || [],
      genres: item.genres || [],
      keywords: item.keywords || [],
      backdrop: item.backdrop_path ? `${TMDB_IMAGE_BASE}w1280${item.backdrop_path}` : '',
      poster: item.poster_path ? `${TMDB_IMAGE_BASE}w500${item.poster_path}` : '',
      platforms: item.platforms || ['Streaming'],
      overview: item.overview || 'No overview available.'
    };

    // Calculate rating metrics
    movie.baseRatingFormatted = formatRating(movie.baseRating);
    const offset = calculateMovieOffset(movie);
    movie.forYouScore = Math.min(7.0, Math.max(0, movie.baseRating + offset));
    movie.forYouFormatted = formatRating(movie.forYouScore);

    return movie;
  });
}

// --- Custom Offset Algorithm (+2.5 to -2.5) ---
function calculateMovieOffset(movie) {
  let totalWeightedScore = 0;
  let totalWeightAccumulator = 0;

  const actorWeights = [0.20, 0.20, 0.20, 0.10, 0.10, 0.10, 0.025, 0.025, 0.025, 0.025];
  (movie.cast || []).slice(0, 10).forEach((actor, idx) => {
    if (userPreferences.actors[actor] !== undefined) {
      const w = actorWeights[idx];
      totalWeightedScore += userPreferences.actors[actor] * w;
      totalWeightAccumulator += w;
    }
  });

  if (movie.director && userPreferences.directors[movie.director] !== undefined) {
    totalWeightedScore += userPreferences.directors[movie.director] * 1.0;
    totalWeightAccumulator += 1.0;
  }

  const matchingGenres = (movie.genres || []).filter(g => userPreferences.genres[g] !== undefined);
  if (matchingGenres.length > 0) {
    const weightPerGenre = 1.5 / matchingGenres.length;
    matchingGenres.forEach(g => {
      totalWeightedScore += userPreferences.genres[g] * weightPerGenre;
      totalWeightAccumulator += weightPerGenre;
    });
  }

  const matchingKeywords = (movie.keywords || []).filter(k => userPreferences.keywords[k] !== undefined);
  if (matchingKeywords.length > 0) {
    const weightPerKeyword = 2.0 / matchingKeywords.length;
    matchingKeywords.forEach(k => {
      totalWeightedScore += userPreferences.keywords[k] * weightPerKeyword;
      totalWeightAccumulator += weightPerKeyword;
    });
  }

  if (totalWeightAccumulator === 0) return 0;
  const avgElementScore = totalWeightedScore / totalWeightAccumulator;
  return avgElementScore - 4.5;
}

// Format score with precision capped at 7.0
function formatRating(rawScore) {
  const score = Math.min(7.0, Math.max(0, rawScore));
  return score.toFixed(1);
}

// --- Render DOM Elements ---
function createMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <div class="badge-rating">★ ${movie.forYouFormatted}</div>
    <img class="movie-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
    <div class="card-overlay">
      <div class="movie-title">${movie.title}</div>
      <div class="movie-meta">
        <span class="base-rating-text">★ ${movie.baseRatingFormatted}</span>
        <span>${movie.year}</span>
      </div>
    </div>
  `;
  card.addEventListener('click', () => openModal(movie));
  return card;
}

function renderColumn(columnId, movies) {
  const container = document.getElementById(columnId);
  if (!container) return;
  container.innerHTML = '';
  movies.forEach(movie => container.appendChild(createMovieCard(movie)));
}

// --- Modal Display Logic ---
const modal = document.getElementById('movieModal');
const closeModalBtn = document.getElementById('closeModal');

function openModal(movie) {
  document.getElementById('modalTitle').innerText = `${movie.title} (${movie.year})`;
  document.getElementById('modalSubhead').innerText = `${(movie.genres || []).join(' • ')}`;
  document.getElementById('modalHero').style.backgroundImage = `url('${movie.backdrop}')`;
  document.getElementById('modalForYouScore').innerText = `★ ${movie.forYouFormatted}/7`;
  document.getElementById('modalBaseScore').innerText = `★ ${movie.baseRatingFormatted}/7`;
  document.getElementById('modalOverview').innerText = movie.overview;
  document.getElementById('modalDirector').innerText = movie.director || 'N/A';
  document.getElementById('modalCast').innerText = (movie.cast || []).join(', ') || 'N/A';
  document.getElementById('modalKeywords').innerText = (movie.keywords || []).map(k => `#${k}`).join(' ');

  const platformContainer = document.getElementById('modalPlatforms');
  platformContainer.innerHTML = '';
  (movie.platforms || []).forEach(p => {
    const badge = document.createElement('span');
    badge.className = 'platform-badge';
    badge.innerText = p;
    platformContainer.appendChild(badge);
  });

  modal.classList.add('active');
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
}
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

// --- Search Filter Logic ---
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const allColumns = ['row-foryou', 'row-recommended', 'row-remix', 'row-toprated'];
    
    allColumns.forEach(columnId => {
      const container = document.getElementById(columnId);
      if (!container) return;
      Array.from(container.children).forEach(card => {
        const title = card.querySelector('.movie-title').innerText.toLowerCase();
        card.style.display = title.includes(query) ? 'block' : 'none';
      });
    });
  });
}

// --- Async Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  const dataset = await fetchMovies();
  
  renderColumn('row-foryou', [...dataset].sort((a,b) => b.forYouScore - a.forYouScore));
  renderColumn('row-recommended', dataset);
  renderColumn('row-remix', [...dataset].sort(() => 0.5 - Math.random()));
  renderColumn('row-toprated', [...dataset].sort((a,b) => b.baseRating - a.baseRating));
});
