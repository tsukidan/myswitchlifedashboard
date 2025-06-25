// public/js/library.js

// Helper to build a full https:// URL and switch t_thumb → t_cover_big
function buildCoverUrl(raw) {
  if (!raw) return null;
  let url = raw;
  // protocol-relative
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }
  // root-relative (just in case)
  else if (url.startsWith('/')) {
    url = 'https://images.igdb.com' + url;
  }
  // now switch thumbnail → cover_big
  return url.replace('t_thumb', 't_cover_big');
}

async function loadFullLibrary() {
  try {
    const res = await fetch('/api/games');
    const games = await res.json();

    const grid    = document.getElementById('game-library-grid');
    const loading = document.getElementById('game-library-loading');

    grid.innerHTML = games.map(game => {
      const coverURL = buildCoverUrl(game.cover?.url)
        ?? 'https://via.placeholder.com/264x374?text=No+Cover';

      const release = game.first_release_date
        ? new Date(game.first_release_date * 1000).toLocaleDateString()
        : 'Unknown release';

      const summary = game.summary || 'No description available.';

      return `
        <div class="library-game"
             data-id="${game.id}"
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

    // Tilt all covers
    VanillaTilt.init(document.querySelectorAll('.tilt-effect'), {
      max: 25, speed: 400, scale: 1.05,
      glare: true, 'max-glare': 0.3, perspective: 1000
    });

    // Modal wiring
    const modal            = document.getElementById('game-modal');
    const modalCover       = document.getElementById('modal-cover');
    const modalTitle       = document.getElementById('modal-title');
    const modalTitleBottom = document.getElementById('modal-title-bottom');
    const modalRelease     = document.getElementById('modal-release');
    const modalSummary     = document.getElementById('modal-summary');
    const closeBtn         = document.getElementById('modal-close');

    function bindModal(card) {
      card.addEventListener('click', () => {
        modalCover.src             = card.dataset.cover;
        modalTitle.textContent     = card.dataset.name;
        modalTitleBottom.textContent = card.dataset.name;
        modalRelease.textContent   = card.dataset.release;
        modalSummary.textContent   = card.dataset.summary;
        modal.classList.add('open');
      });
    }

    grid.querySelectorAll('.library-game').forEach(card => {
      // remove handler
      const btn = card.querySelector('.remove-game-btn');
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        await fetch(`/api/games?id=${card.dataset.id}`, { method: 'DELETE' });
        card.remove();
      });
      // modal handler
      bindModal(card);
    });

    // close modal
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.remove('open');
    });

  } catch (err) {
    console.error('Failed to load full library:', err);
    document.getElementById('game-library-loading').textContent =
      'Could not load library.';
  }
}

window.addEventListener('DOMContentLoaded', loadFullLibrary);
window.loadFullLibrary = loadFullLibrary;
