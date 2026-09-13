const WORKER_URL = 'https://apisecure.lagcoder.workers.dev';

async function testConnection() {
  try {
    const response = await fetch(`${WORKER_URL}?q=Inception`);
    const data = await response.json();
    console.log('Worker is working securely:', data);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
// --- User Profile Preferences ---
const userPreferences = {
  actors: { "Leonardo DiCaprio": 7.0, "Christian Bale": 6.5, "Cillian Murphy": 6.0 },
  directors: { "Christopher Nolan": 7.0, "Denis Villeneuve": 6.5 },
  genres: { "Sci-Fi": 6.5, "Thriller": 6.0, "Drama": 5.0 },
  keywords: { "mind-bending": 7.0, "space": 6.5, "dystopia": 6.0 }
};

// --- Custom Offset Algorithm (+2.5 to -2.5) ---
function calculateMovieOffset(movie) {
  let totalWeightedScore = 0;
  let totalWeightAccumulator = 0;

  const actorWeights = [0.20, 0.20, 0.20, 0.10, 0.10, 0.10, 0.025, 0.025, 0.025, 0.025];
  movie.cast.slice(0, 10).forEach((actor, idx) => {
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

  const matchingGenres = movie.genres.filter(g => userPreferences.genres[g] !== undefined);
  if (matchingGenres.length > 0) {
    const weightPerGenre = 1.5 / matchingGenres.length;
    matchingGenres.forEach(g => {
      totalWeightedScore += userPreferences.genres[g] * weightPerGenre;
      totalWeightAccumulator += weightPerGenre;
    });
  }

  const matchingKeywords = movie.keywords.filter(k => userPreferences.keywords[k] !== undefined);
  if (matchingKeywords.length > 0) {
    const weightPerKeyword = 2.0 / matchingKeywords.length;
    matchingKeywords.forEach(k => {
      totalWeightedScore += userPreferences.keywords[k] * weightPerKeyword;
      totalWeightAccumulator += weightPerKeyword;
    });
  }

  if (totalWeightAccumulator === 0) return 0;
  const avgElementScore = totalWeightedScore / totalWeightAccumulator;
  return avgElementScore - 4.5; // Offset within +/- 2.5 range
}

// Halve raw TMDB ratings (out of 10 -> out of 5/7 scale) and format with 0.1 precision capped at 7.0
function formatRating(rawScore) {
  const score = Math.min(7.0, Math.max(0, rawScore));
  return score.toFixed(1);
}

// --- Seed Datasets (Base TMDB Ratings Halved out of 5 -> 7 scale) ---
const seedMovies = [
  { id: 1, title: "Inception", year: 2010, baseRating: 4.4, director: "Christopher Nolan", cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"], genres: ["Sci-Fi", "Action"], keywords: ["mind-bending", "subconscious", "heist"], backdrop: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400", platforms: ["Netflix", "Max"], overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O." },
  { id: 2, title: "Interstellar", year: 2014, baseRating: 4.3, director: "Christopher Nolan", cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"], genres: ["Sci-Fi", "Drama"], keywords: ["space", "black hole", "time dilation"], backdrop: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400", platforms: ["Paramount+", "Prime"], overview: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans." },
  { id: 3, title: "Dune: Part Two", year: 2024, baseRating: 4.3, director: "Denis Villeneuve", cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"], genres: ["Sci-Fi", "Adventure"], keywords: ["dystopia", "desert", "prophecy"], backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400", platforms: ["Max"], overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family." },
  { id: 4, title: "The Dark Knight", year: 2008, baseRating: 4.5, director: "Christopher Nolan", cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"], genres: ["Action", "Crime", "Thriller"], keywords: ["vigilante", "chaos", "gotham"], backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400", platforms: ["Max", "4K Rent"], overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice." },
  { id: 5, title: "Oppenheimer", year: 2023, baseRating: 4.2, director: "Christopher Nolan", cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon"], genres: ["Drama", "History"], keywords: ["atomic bomb", "physics", "biography"], backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200", poster: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400", platforms: ["Peacock"], overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb." }
];

// Replicate seed items into full dataset
function generateDataset(baseList) {
  const fullSet = [];
  for (let i = 0; i < 20; i++) {
    const item = { ...baseList[i % baseList.length] };
    item.id = i + 100;
    item.title = `${item.title} ${i > 4 ? '#' + (i + 1) : ''}`;
    
    // Halved base score
    item.baseRatingFormatted = formatRating(item.baseRating);
    
    // Calculated personalized score max capped at 7.0 with 0.1 precision
    const offset = calculateMovieOffset(item);
    item.forYouScore = Math.min(7.0, Math.max(0, item.baseRating + offset));
    item.forYouFormatted = formatRating(item.forYouScore);
    
    fullSet.push(item);
  }
  return fullSet;
}

// --- Render DOM Elements ---
function createMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <!-- Top Left Badge: For You Rating -->
    <div class="badge-rating">★ ${movie.forYouFormatted}</div>
    <img class="movie-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
    <div class="card-overlay">
      <div class="movie-title">${movie.title}</div>
      <div class="movie-meta">
        <!-- Bottom Left: Non-personalized Base Rating -->
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
  container.innerHTML = '';
  movies.forEach(movie => container.appendChild(createMovieCard(movie)));
}

// --- Modal Display Logic ---
const modal = document.getElementById('movieModal');
const closeModalBtn = document.getElementById('closeModal');

function openModal(movie) {
  document.getElementById('modalTitle').innerText = `${movie.title} (${movie.year})`;
  document.getElementById('modalSubhead').innerText = `${movie.genres.join(' • ')}`;
  document.getElementById('modalHero').style.backgroundImage = `url('${movie.backdrop}')`;
  document.getElementById('modalForYouScore').innerText = `★ ${movie.forYouFormatted}/7`;
  document.getElementById('modalBaseScore').innerText = `★ ${movie.baseRatingFormatted}/7`;
  document.getElementById('modalOverview').innerText = movie.overview;
  document.getElementById('modalDirector').innerText = movie.director;
  document.getElementById('modalCast').innerText = movie.cast.join(', ');
  document.getElementById('modalKeywords').innerText = movie.keywords.map(k => `#${k}`).join(' ');

  const platformContainer = document.getElementById('modalPlatforms');
  platformContainer.innerHTML = '';
  movie.platforms.forEach(p => {
    const badge = document.createElement('span');
    badge.className = 'platform-badge';
    badge.innerText = p;
    platformContainer.appendChild(badge);
  });

  modal.classList.add('active');
}

closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('active');
});

// --- Search Filter Logic ---
document.getElementById('searchInput').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  const allColumns = ['row-foryou', 'row-recommended', 'row-remix', 'row-toprated'];
  
  allColumns.forEach(columnId => {
    const container = document.getElementById(columnId);
    Array.from(container.children).forEach(card => {
      const title = card.querySelector('.movie-title').innerText.toLowerCase();
      card.style.display = title.includes(query) ? 'block' : 'none';
    });
  });
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const dataset = generateDataset(seedMovies);
  
  renderColumn('row-foryou', [...dataset].sort((a,b) => b.forYouScore - a.forYouScore));
  renderColumn('row-recommended', dataset);
  renderColumn('row-remix', [...dataset].sort(() => 0.5 - Math.random()));
  renderColumn('row-toprated', [...dataset].sort((a,b) => b.baseRating - a.baseRating));
});
