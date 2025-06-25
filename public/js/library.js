// src/js/library.js
// Load and render the full game library with delete buttons and modal data

async function loadFullLibrary() {
  try {
    const res = await fetch('/api/games');
    const games = await res.json();

    const grid    = document.getElementById('game-library-grid');
    const loading = document.getElementById('game-library-loading');

    grid.innerHTML = games.map(game => {
      const coverURL = game.cover?.url
        ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`
        : 'https://via.placeholder.com/264x374?text=No+Cover';

      // format release date if available (IGDB returns UNIX timestamp)
      const release = game.first_release_date
        ? new Date(game.first_release_date * 1000).toLocaleDateString()
        : 'Unknown release';

      const summary = game.summary || 'No description available.';

      return `
        <div class="library-game"
             data-name="${game.name}"
             data-cover="${coverURL}"
             data-release="${release}"
             data-summary="${summary}">
          <img class="library-cover tilt-effect" src="${coverURL}" alt="${game.name}" />
          <div class="library-title">${game.name}</div>
          <button class="remove-game-btn icon-button" title="Remove Game">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" x2="10" y1="11" y2="17"/>
              <line x1="14" x2="14" y1="11" y2="17"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    loading.style.display = 'none';
    grid.style.display   = 'grid';

    // Initialize tilt effect on all covers
    VanillaTilt.init(document.querySelectorAll('.tilt-effect'), {
      max: 25, speed: 400, scale: 1.05,
      glare: true, "max-glare": 0.3, perspective: 1000
    });

    // Attach remove handlers
    grid.querySelectorAll('.remove-game-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.library-game').remove();
      });
    });

  } catch (err) {
    console.error('Failed to load full library:', err);
    document.getElementById('game-library-loading').textContent =
      'Could not load library.';
  }
}

window.addEventListener('DOMContentLoaded', loadFullLibrary);
