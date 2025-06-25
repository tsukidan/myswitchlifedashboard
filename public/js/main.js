// public/js/main.js

// 1) Load Dashboard Games & Recent Activity (unchanged)
async function loadDashboardGames() {
  try {
    const libRes    = await fetch('/api/games');
    const allGames  = await libRes.json();

    // --- Recent Activity ---
    const recent = allGames
      .filter(g => g.last_played)
      .sort((a,b)=> new Date(b.last_played) - new Date(a.last_played))
      .slice(0,9);

    const recentContainer = document.getElementById('recent-activity-container');
    const recentLoading   = document.getElementById('recent-activity-loading');

    if (!recent.length) {
      recentContainer.innerHTML = '<p style="color:#666; padding:20px;">No recent activity yet.</p>';
      recentContainer.style.display = 'block';
    } else {
      recentContainer.innerHTML = recent.map(game => {
        const imgURL = game.cover?.url
          ? `https:${game.cover.url.replace('t_thumb','t_cover_big')}`
          : 'https://via.placeholder.com/60x80?text=No+Cover';
        const daysAgo = Math.floor((Date.now() - new Date(game.last_played)) / (1000*60*60*24));
        return `
          <div class="game-entry">
            <img class="game-cover tilt-effect" src="${imgURL}" alt="${game.name}" />
            <div class="game-info">
              <strong>${game.name}</strong>
              <em class="last-played-text">
                Last played: ${daysAgo} day${daysAgo!==1?'s':''} ago
              </em>
            </div>
          </div>
        `;
      }).join('');
      recentContainer.style.display = 'flex';
    }
    recentLoading.style.display = 'none';

    VanillaTilt.init(document.querySelectorAll('.tilt-effect'), {
      max:25, speed:400, scale:1.05, glare:true, 'max-glare':0.3, perspective:1000
    });

    // --- Full Library ---
    const libraryGrid    = document.getElementById('game-library-grid');
    const libraryLoading = document.getElementById('game-library-loading');

    libraryGrid.innerHTML = allGames.map(game => {
      const imgURL = game.cover?.url
        ? `https:${game.cover.url.replace('t_thumb','t_cover_big')}`
        : 'https://via.placeholder.com/264x374?text=No+Cover';
      return `
        <div class="library-game">
          <img class="library-cover tilt-effect" src="${imgURL}" alt="${game.name}" />
          <div class="library-title">${game.name}</div>
        </div>
      `;
    }).join('');
    libraryLoading.style.display = 'none';
    libraryGrid.style.display   = 'grid';

    VanillaTilt.init(document.querySelectorAll('.tilt-effect'), {
      max:25, speed:400, scale:1.05, glare:true, 'max-glare':0.3, perspective:1000
    });

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    document.getElementById('recent-activity-loading').textContent =
      'Could not load recent activity.';
  }
}

// 2) Load & render all goals, grouped by game
async function loadGoals() {
  const container = document.getElementById('goal-list');
  container.innerHTML = ''; // clear previous

  // fetch both libraries & goals
  const [gamesRes, goalsRes] = await Promise.all([
    fetch('/api/games'),
    fetch('/api/goals')
  ]);
  const [games, goals] = await Promise.all([
    gamesRes.json(),
    goalsRes.json()
  ]);

  // group goals by gameId (string)
  const byGame = {};
  goals.forEach(g => {
    const key = String(g.gameId);
    (byGame[key] ||= []).push(g);
  });

  // for each game that has any goals, render a <li class="goal-section">
  games.forEach(game => {
    const key = String(game.id);
    const list = byGame[key];
    if (!list) return;

    const section = document.createElement('li');
    section.className = 'goal-section';
    section.dataset.gameId = key;
    section.innerHTML = `
      <h4>${game.name}</h4>
      <ul class="goal-items">
        ${list.map(item => `
          <li class="goal-item" data-id="${item._id}">
            <input type="checkbox" ${item.done ? 'checked' : ''} />
            <span contenteditable="true">${item.text}</span>
            <button class="remove-goal-btn icon-button" title="Remove Goal">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                   viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7
                     c-1 0-2-1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </li>
        `).join('')}
      </ul>
    `;
    container.appendChild(section);
  });
}

// 3) Wire up Add‐Goal modal & CRUD operations
function setupGoalUI() {
  const gameSelect  = document.getElementById('goal-game-select');
  const addBtn      = document.getElementById('add-goal-btn');
  const modal       = document.getElementById('goal-modal');
  const cancelBtn   = document.getElementById('goal-cancel');
  const saveBtn     = document.getElementById('goal-save');
  const input       = document.getElementById('new-goal-input');
  const container   = document.getElementById('goal-list');

  let currentGameId  = null;
  let currentGameName = '';

  // Populate the “Pick a game” dropdown
  fetch('/api/games')
    .then(r => r.json())
    .then(games => {
      games.forEach(g => {
        const opt = document.createElement('option');
        opt.value       = g.id;
        opt.textContent = g.name;
        gameSelect.appendChild(opt);
      });
    });

  // Enable Add button when a game is selected
  gameSelect.addEventListener('change', () => {
    currentGameId   = gameSelect.value;
    currentGameName = gameSelect.selectedOptions[0].textContent;
    addBtn.disabled = !currentGameId;
  });

  // Open mini-modal
  addBtn.addEventListener('click', () => {
    input.value = '';
    modal.classList.add('open');
    input.focus();
  });

  // Close modal
  cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
  });

  // Save new goal → persist → reload entire list
  saveBtn.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, gameId: currentGameId })
      });
      modal.classList.remove('open');
      await loadGoals();
    } catch (err) {
      console.error('Error saving new goal:', err);
    }
  });

  // Delegate removal
  container.addEventListener('click', async e => {
    const btn = e.target.closest('.remove-goal-btn');
    if (!btn) return;
    const li = btn.closest('li[data-id]');
    try {
      await fetch(`/api/goals?id=${li.dataset.id}`, { method: 'DELETE' });
      await loadGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  });

  // Delegate toggle
  container.addEventListener('change', async e => {
    if (e.target.type !== 'checkbox') return;
    const li = e.target.closest('li[data-id]');
    try {
      await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: li.dataset.id, done: e.target.checked })
      });
    } catch (err) {
      console.error('Error toggling goal:', err);
    }
  });
}

// 4) Kick everything off
window.addEventListener('DOMContentLoaded', () => {
  loadDashboardGames();
  loadGoals();
  setupGoalUI();
});
