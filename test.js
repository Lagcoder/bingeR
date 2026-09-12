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
  actors: { "Leonardo DiCaprio": 9.5, "Christian Bale": 9.0, "Cillian Murphy": 8.5 },
  directors: { "Christopher Nolan": 9.5, "Denis Villeneuve": 9.0 },
  genres: { "Sci-Fi": 9.0, "Thriller": 8.5, "Drama": 7.0 },
  keywords: { "mind-bending": 9.5, "space": 9.0, "dystopia": 8.5 }
};

// --- Custom Weighted Formula Engine ---
function calculateMovieOffset(movie) {
  let totalWeightedScore = 0;
  let totalWeightAccumulator = 0;

  // 1. Actors: Top 10 with position-based weight splits
  const actorWeights = [0.20, 0.20, 0.20, 0.10, 0.10, 0.10, 0.025, 0.025, 0.025, 0.025];
  movie.cast.slice(0, 10).forEach((actor, idx) => {
    if (userPreferences.actors[actor] !== undefined) {
      const w = actorWeights[idx];
      totalWeightedScore += userPreferences.actors[actor] * w;
      totalWeightAccumulator += w;
    }
  });

  // 2. Director (1.0x weight)
  if (movie.director && userPreferences.directors[movie.director] !== undefined) {
    totalWeightedScore += userPreferences.directors[movie.director] * 1.0;
    totalWeightAccumulator += 1.0;
  }

  // 3. Genres (1.5x total split)
  const matchingGenres = movie.genres.filter(g => userPreferences.genres[g] !== undefined);
  if (matchingGenres.length > 0) {
    const weightPerGenre = 1.5 / matchingGenres.length;
    matchingGenres.forEach(g => {
      totalWeightedScore += userPreferences.genres[g] * weightPerGenre;
      totalWeightAccumulator += weightPerGenre;
    });
  }

  // 4. Keywords (2.0x total split)
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
  return avgElementScore - 5; // Scales -5 to +5
}

// Convert "For You" score to 0–7 Badge rating scale
function formatBadgeScore(forYouScore) {
  return (Math.max(0, Math.min(10, forYouScore)) * (7 / 10)).toFixed(1);
}

// --- Seed Datasets ---
const seedMovies = [
  { id: 1, title: "Inception", year: 2010, tmdbRating: 8.4, director: "Christopher Nolan", cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"], genres: ["Sci-Fi", "Action"], keywords: ["mind-bending", "subconscious", "heist"], backdrop: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400", platforms: ["Netflix", "Max"], overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O." },
  { id: 2, title: "Interstellar", year: 2014, tmdbRating: 8.6, director: "Christopher Nolan", cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"], genres: ["Sci-Fi", "Drama"], keywords: ["space", "black hole", "time dilation"], backdrop: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400", platforms: ["Paramount+", "Prime"], overview: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans." },
  { id: 3, title: "Dune: Part Two", year: 2024, tmdbRating: 8.5, director: "Denis Villeneuve", cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"], genres: ["Sci-Fi", "Adventure"], keywords: ["dystopia", "desert", "prophecy"], backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400", platforms: ["Max"], overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family." },
  { id: 4, title: "The Dark Knight", year: 2008, tmdbRating: 8.5, director: "Christopher Nolan", cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"], genres: ["Action", "Crime", "Thriller"], keywords: ["vigilante", "chaos", "gotham"], backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400", platforms: ["Max", "4K Rent"], overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice." },
  { id: 5, title: "Oppenheimer", year: 2023, tmdbRating: 8.1, director: "Christopher Nolan", cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon"], genres: ["Drama", "History"], keywords: ["atomic bomb", "physics", "biography"], backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200", poster: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400", platforms: ["Peacock"], overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb." }
];

// Replicate seed items into a 20-item list per column
function generateDataset(baseList) {
  const fullSet = [];
  for (let i = 0; i < 20; i++) {
    const item = { ...baseList[i % baseList.length] };
    item.id = i + 100;
    item.title = `${item.title} ${i > 4 ? '#' + (i + 1) : ''}`;
    const offset = calculateMovieOffset(item);
    item.forYouScore = Math.max(0, Math.min(10, item.tmdbRating + offset));
    item.badgeNumber = formatBadgeScore(item.forYouScore);
    fullSet.push(item);
  }
  return fullSet;
}

// --- Render DOM Elements ---
function createMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <div class="badge-rating">${movie.badgeNumber}</div>
    <img class="movie-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
    <div class="card-overlay">
      <div class="movie-title">${movie.title}</div>
      <div class="movie-meta">
        <span>${movie.year}</span>
        <span>★ ${movie.forYouScore.toFixed(1)}</span>
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
  document.getElementById('modalForYouScore').innerText = movie.forYouScore.toFixed(1);
  document.getElementById('modalBaseScore').innerText = movie.tmdbRating.toFixed(1);
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

// --- Lifecycle Init ---
document.addEventListener('DOMContentLoaded', () => {
  const dataset = generateDataset(seedMovies);
  
  // Populate each vertical column section with 20 items
  renderColumn('row-foryou', [...dataset].sort((a,b) => b.forYouScore - a.forYouScore));
  renderColumn('row-recommended', dataset);
  renderColumn('row-remix', [...dataset].sort(() => 0.5 - Math.random()));
  renderColumn('row-toprated', [...dataset].sort((a,b) => b.tmdbRating - a.tmdbRating));
});
