// src/js/library-dropdown.js
// Populate the dropdown with “all-games minus owned”
// Handle add/remove and wire up modal opening for every card

document.addEventListener('DOMContentLoaded', () => {
  const select  = document.getElementById('add-game-select');
  const addBtn  = document.getElementById('confirm-add-game');
  const grid    = document.getElementById('game-library-grid');
  const loading = document.getElementById('game-library-loading');
  const modal   = document.getElementById('game-modal');
  const modalCover  = document.getElementById('modal-cover');
  const modalTitle  = document.getElementById('modal-title');
  const modalTitleBottom = document.getElementById('modal-title-bottom');
  const modalRelease    = document.getElementById('modal-release');
  const modalSummary    = document.getElementById('modal-summary');
  const modalCloseBtn   = document.getElementById('modal-close');

  let owned   = [];
  let catalog = [];

  // Utility: bind a card to open the modal
  function bindModal(card) {
    card.addEventListener('click', () => {
      // pull data from attributes
      modalCover.src   = card.dataset.cover;
      modalTitle.textContent       = card.dataset.name;
      modalTitleBottom.textContent = card.dataset.name;
      modalRelease.textContent     = card.dataset.release;
      modalSummary.textContent     = card.dataset.summary;

      // show modal
      modal.style.display = 'flex';
    });
  }

  // Close modal when clicking the X
  modalCloseBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // step 1: load owned library
  fetch('/api/games')
    .then(r => r.json())
    .then(data => {
      owned = data;
      renderOwned(data);
      // then fetch the full catalog so we can drop into dropdown
      return fetch('/api/all-games');
    })
    // step 2: load full catalog
    .then(r => r.json())
    .then(data => {
      catalog = data;
      populateDropdown();
    })
    .catch(err => console.error('Library dropdown error:', err));


  function renderOwned(games) {
    // hide loading, show grid
    loading.style.display = 'none';
    grid.style.display    = 'grid';

    // build each card with data-attributes for modal
    grid.innerHTML = games.map(game => {
      const coverURL = game.cover.url.replace('t_thumb','t_cover_big');
      // release & summary might come from game.first_release_date & game.summary
      const release = game.first_release_date
        ? new Date(game.first_release_date * 1000).toLocaleDateString()
        : 'Unknown release';
      const summary = game.summary || 'No description available.';
      return `
        <div class="library-game"
             data-name="${game.name}"
             data-cover="https:${coverURL}"
             data-release="${release}"
             data-summary="${summary}">
          <img class="library-cover tilt-effect" src="https:${coverURL}" alt="${game.name}" />
          <div class="library-title">${game.name}</div>
          <button class="remove-game-btn" title="Remove">&#128465;</button>
        </div>
      `;
    }).join('');

    // init tilt
    VanillaTilt.init(document.querySelectorAll('.tilt-effect'), {
      max:25, speed:400, scale:1.05, glare:true, 'max-glare':0.3, perspective:1000
    });

    // wire up both remove buttons and modal opening for existing cards
    document.querySelectorAll('.library-game').forEach(card => {
      // remove handler
      card.querySelector('.remove-game-btn').addEventListener('click', e => {
        e.stopPropagation();
        const name = card.dataset.name;
        card.remove();
        // re-add to dropdown
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });
      // modal handler
      bindModal(card);
    });
  }

  function populateDropdown() {
    // filter out already owned
    const ownedNames = new Set(owned.map(g => g.name));
    catalog
      .filter(g => !ownedNames.has(g.name))
      .forEach(game => {
        const opt = document.createElement('option');
        opt.value       = game.name;
        opt.textContent = game.name;
        select.appendChild(opt);
      });
  }

  addBtn.addEventListener('click', () => {
    const name = select.value;
    if (!name) return;
    const game = catalog.find(g => g.name === name);
    if (!game) return;

    // build new card
    const coverURL = game.cover.url.replace('t_thumb','t_cover_big');
    const release  = game.first_release_date
      ? new Date(game.first_release_date * 1000).toLocaleDateString()
      : 'Unknown release';
    const summary = game.summary || 'No description available.';

    const card = document.createElement('div');
    card.className = 'library-game';
    card.dataset.name    = game.name;
    card.dataset.cover   = `https:${coverURL}`;
    card.dataset.release = release;
    card.dataset.summary = summary;
    card.innerHTML = `
      <img class="library-cover tilt-effect" src="https:${coverURL}" alt="${game.name}" />
      <div class="library-title">${game.name}</div>
      <button class="remove-game-btn" title="Remove">&#128465;</button>
    `;

    loading.style.display = 'none';
    grid.style.display    = 'grid';
    grid.appendChild(card);

    // re-init tilt on this new card
    VanillaTilt.init(card.querySelectorAll('.tilt-effect'), {
      max:25, speed:400, scale:1.05, glare:true, 'max-glare':0.3, perspective:1000
    });

    // wire remove
    const removeBtn = card.querySelector('.remove-game-btn');
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      card.remove();
      // re-add to dropdown
      const opt = document.createElement('option');
      opt.value       = name;
      opt.textContent = name;
      select.appendChild(opt);
    });

    // wire modal
    bindModal(card);

    // finally, remove this option from the dropdown
    select.querySelector(`option[value="${name}"]`).remove();
    select.value = '';
  });
});
