// === public/library-dropdown.js ===
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
          <button class="remove-game-btn" title="Remove">&#128465;</button>
        </div>
      `;
    }).join('');

    VanillaTilt.init(document.querySelectorAll('.tilt-effect'), {
      max: 25, speed: 400, scale: 1.05, glare: true, 'max-glare': 0.3, perspective: 1000
    });

    document.querySelectorAll('.library-game').forEach(card => {
      card.querySelector('.remove-game-btn').addEventListener('click', async e => {
        e.stopPropagation();
        const id = card.dataset.id;
        await fetch(`/api/games?id=${id}`, { method: 'DELETE' });
        card.remove();
        const opt = document.createElement('option');
        opt.value = card.dataset.name;
        opt.textContent = card.dataset.name;
        select.appendChild(opt);
      });

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
    catalog.filter(g => !ownedNames.has(g.name)).forEach(game => {
      const opt = document.createElement('option');
      opt.value = game.name;
      opt.textContent = game.name;
      select.appendChild(opt);
    });
  }

  addBtn.addEventListener('click', () => {
    const name = select.value;
    if (!name) return;
    const game = catalog.find(g => g.name === name);
    if (!game) return;

    pendingGame = game;
    lpInput.value = new Date().toISOString().split('T')[0]; // pre-fill today
    lpModal.classList.add('open');
  });

  lpCancel.addEventListener('click', () => {
    lpModal.classList.remove('open');
    pendingGame = null;
  });

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
      <button class="remove-game-btn" title="Remove">&#128465;</button>
    `;

    grid.appendChild(card);
    VanillaTilt.init(card.querySelectorAll('.tilt-effect'), {
      max: 25, speed: 400, scale: 1.05, glare: true, 'max-glare': 0.3, perspective: 1000
    });

    card.querySelector('.remove-game-btn').addEventListener('click', async e => {
      e.stopPropagation();
      await fetch(`/api/games?id=${game.id}`, { method: 'DELETE' });
      card.remove();
      const opt = document.createElement('option');
      opt.value = game.name;
      opt.textContent = game.name;
      select.appendChild(opt);
    });

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

    select.querySelector(`option[value="${game.name}"]`)?.remove();
    select.value = '';
  });
});
