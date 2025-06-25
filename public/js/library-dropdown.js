// === public/js/library-dropdown.js ===
// Handles dropdown add/remove, modal binding, and DB sync

document.addEventListener('DOMContentLoaded', () => {
  const select   = document.getElementById('add-game-select');
  const addBtn   = document.getElementById('confirm-add-game');
  const grid     = document.getElementById('game-library-grid');
  const loading  = document.getElementById('game-library-loading');

  const lpModal  = document.getElementById('last-played-modal');
  const lpInput  = document.getElementById('last-played-date');
  const lpSave   = document.getElementById('last-played-confirm');
  const lpCancel = document.getElementById('last-played-cancel');

  let owned = [];
  let catalog = [];
  let pendingGame = null; // game waiting for "last played" input

  // load saved library, then catalog
  fetch('/api/games')
    .then(r => r.json())
    .then(data => {
      owned = data;
      renderOwned(data);
      return fetch('/api/all-games');
    })
    .then(r => r.json())
    .then(data => {
      catalog = data;
      populateDropdown();
    })
    .catch(err => console.error('Library dropdown error:', err));

  function renderOwned(games) {
    loading.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = games.map(game => {
      const coverURL = game.cover?.url
        ? `https:${game.cover.url.replace('t_thumb','t_cover_big')}`
        : 'https://via.placeholder.com/264x374?text=No+Cover';
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

    // tilt effect
    VanillaTilt.init(document.querySelectorAll('.tilt-effect'), {
      max: 25, speed: 400, scale: 1.05, glare: true, 'max-glare': 0.3, perspective: 1000
    });

    // hook up remove & modal on each card
    document.querySelectorAll('.library-game').forEach(card => {
      // remove
      card.querySelector('.remove-game-btn').addEventListener('click', async e => {
        e.stopPropagation();
        const id = card.dataset.id;
        await fetch(`/api/games?id=${id}`, { method: 'DELETE' });
        card.remove();
        // put back into dropdown
        const opt = document.createElement('option');
        opt.value = card.dataset.name;
        opt.textContent = card.dataset.name;
        select.appendChild(opt);
      });

      // open details modal
      card.addEventListener('click', () => {
        const modal = document.getElementById('game-modal');
        const modalCover = document.getElementById('modal-cover');
        const modalTitle = document.getElementById('modal-title');
        const modalTitleBottom = document.getElementById('modal-title-bottom');
        const modalRelease = document.getElementById('modal-release');
        const modalSummary = document.getElementById('modal-summary');

        modalCover.src = card.dataset.cover;
        modalTitle.textContent = card.dataset.name;
        modalTitleBottom.textContent = card.dataset.name;
        modalRelease.textContent = card.dataset.release;
        modalSummary.textContent = card.dataset.summary;
        modal.classList.add('open');
      });
    });
  }

  function populateDropdown() {
    const ownedNames = new Set(owned.map(g => g.name));
    catalog
      .filter(g => !ownedNames.has(g.name))
      .forEach(game => {
        const opt = document.createElement('option');
        opt.value = game.name;
        opt.textContent = game.name;
        select.appendChild(opt);
      });
  }

  // kick off the "add" flow by showing the last-played modal
  addBtn.addEventListener('click', () => {
    const name = select.value;
    if (!name) return;
    pendingGame = catalog.find(g => g.name === name);
    lpInput.value = new Date().toISOString().split('T')[0]; // default today
    lpModal.classList.add('open');
  });

  // cancel last-played
  lpCancel.addEventListener('click', () => {
    lpModal.classList.remove('open');
    pendingGame = null;
  });

  // save last-played, persist, render new card
  lpSave.addEventListener('click', async () => {
    if (!pendingGame) return;
    const game = pendingGame;
    const lastPlayed = lpInput.value || new Date().toISOString().split('T')[0];
    lpModal.classList.remove('open');
    pendingGame = null;

    const coverURL = game.cover?.url
      ? `https:${game.cover.url.replace('t_thumb','t_cover_big')}`
      : 'https://via.placeholder.com/264x374?text=No+Cover';
    const release = game.first_release_date
      ? new Date(game.first_release_date * 1000).toLocaleDateString()
      : 'Unknown release';
    const summary = game.summary || 'No description available.';

    // build card
    const card = document.createElement('div');
    card.className = 'library-game';
    card.dataset.id = game.id;
    card.dataset.name = game.name;
    card.dataset.cover = coverURL;
    card.dataset.release = release;
    card.dataset.summary = summary;
    card.innerHTML = `
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
    `;

    grid.appendChild(card);
    // re-init tilt on the new card
    VanillaTilt.init(card.querySelectorAll('.tilt-effect'), {
      max: 25, speed: 400, scale: 1.05, glare: true, 'max-glare': 0.3, perspective: 1000
    });

    // remove handler
    card.querySelector('.remove-game-btn').addEventListener('click', async e => {
      e.stopPropagation();
      await fetch(`/api/games?id=${game.id}`, { method: 'DELETE' });
      card.remove();
      const opt = document.createElement('option');
      opt.value = game.name;
      opt.textContent = game.name;
      select.appendChild(opt);
    });

    // details modal handler
    card.addEventListener('click', () => {
      const modal = document.getElementById('game-modal');
      const modalCover = document.getElementById('modal-cover');
      const modalTitle = document.getElementById('modal-title');
      const modalTitleBottom = document.getElementById('modal-title-bottom');
      const modalRelease = document.getElementById('modal-release');
      const modalSummary = document.getElementById('modal-summary');

      modalCover.src = card.dataset.cover;
      modalTitle.textContent = card.dataset.name;
      modalTitleBottom.textContent = card.dataset.name;
      modalRelease.textContent = card.dataset.release;
      modalSummary.textContent = card.dataset.summary;
      modal.classList.add('open');
    });

    // persist to Mongo
    await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: game.id,
        name: game.name,
        cover: game.cover,
        summary: game.summary,
        first_release_date: game.first_release_date,
        last_played: lastPlayed
      })
    });

    // remove from dropdown
    select.querySelector(`option[value="${game.name}"]`)?.remove();
    select.value = '';
  });
});
