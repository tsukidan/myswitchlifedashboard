// public/js/main.js

// --- 1) Load Dashboard Games & Recent Activity ---
async function loadDashboardGames() {
  try {
    // Fetch your saved library (with last_played)
    const libRes = await fetch('/api/games');
    const allGames = await libRes.json();

    // === Recent Activity ===
    const recent = allGames
      .filter(g => g.last_played)                            // only those with a date
      .sort((a, b) => new Date(b.last_played) - new Date(a.last_played))
      .slice(0, 9);

    const recentContainer = document.getElementById('recent-activity-container');
    const recentLoading   = document.getElementById('recent-activity-loading');

    if (recent.length === 0) {
      recentContainer.innerHTML =
        '<p style="color:#666; padding:20px;">No recent activity yet.</p>';
      recentContainer.style.display = 'block';
    } else {
      recentContainer.innerHTML = recent.map(game => {
        const imgURL = game.cover?.url
          ? `https:${game.cover.url.replace('t_thumb','t_cover_big')}`
          : 'https://via.placeholder.com/60x80?text=No+Cover';

        const daysAgo = Math.floor(
          (Date.now() - new Date(game.last_played)) /
          (1000 * 60 * 60 * 24)
        );

        return `
          <div class="game-entry">
            <img class="game-cover tilt-effect" src="${imgURL}" alt="${game.name}" />
            <div class="game-info">
              <strong>${game.name}</strong>
              <em class="last-played-text">
                Last played: ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago
              </em>
            </div>
          </div>
        `;
      }).join('');
      recentContainer.style.display = 'flex';
    }
    recentLoading.style.display = 'none';

    // Re-init tilt on recent covers
    VanillaTilt.init(document.querySelectorAll('.tilt-effect'), {
      max:25, speed:400, scale:1.05, glare:true, 'max-glare':0.3, perspective:1000
    });

    // === Full Library ===
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

    // Tilt on library covers
    VanillaTilt.init(document.querySelectorAll('.tilt-effect'), {
      max:25, speed:400, scale:1.05, glare:true, 'max-glare':0.3, perspective:1000
    });

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    document.getElementById('recent-activity-loading').textContent =
      'Could not load recent activity.';
  }
}

// --- 2) Load & Render Goals ---
async function loadGoals() {
  try {
    const res   = await fetch('/api/goals');
    const goals = await res.json();
    const list  = document.getElementById('goal-list');
    list.innerHTML = ''; // clear any placeholders

    goals.forEach(g => {
      const li = document.createElement('li');
      li.className   = 'goal-item';
      li.dataset.id  = g._id;
      li.innerHTML   = `
        <input type="checkbox" ${g.done ? 'checked' : ''}/>
        <span contenteditable="true">${g.text}</span>
        <button class="remove-goal-btn icon-button" title="Remove Goal">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
               viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      `;
      list.appendChild(li);
    });
  } catch (e) {
    console.error('Failed to load goals:', e);
  }
}

// --- 3) Wire Up Add / Remove / Toggle Goals ---
function setupGoalManagement() {
  const list   = document.getElementById('goal-list');
  const addBtn = document.getElementById('add-goal-btn');
  if (!list || !addBtn) return;

  // Add new goal
  addBtn.addEventListener('click', async () => {
    const text = prompt('Enter your new goal:');
    if (!text) return;
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      await loadGoals();
    } catch (e) {
      console.error('Error adding goal:', e);
    }
  });

  // Delete goal
  list.addEventListener('click', async e => {
    const btn = e.target.closest('.remove-goal-btn');
    if (!btn) return;
    const li = btn.closest('li');
    const id = li.dataset.id;
    try {
      await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
      li.remove();
    } catch (e) {
      console.error('Error deleting goal:', e);
    }
  });

  // Toggle done
  list.addEventListener('change', async e => {
    if (e.target.type !== 'checkbox') return;
    const li   = e.target.closest('li');
    const id   = li.dataset.id;
    const done = e.target.checked;
    try {
      await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, done })
      });
    } catch (e) {
      console.error('Error toggling goal:', e);
    }
  });
}

// --- Init on Page Load ---
window.addEventListener('DOMContentLoaded', () => {
  loadDashboardGames();
  loadGoals();
  setupGoalManagement();
});
