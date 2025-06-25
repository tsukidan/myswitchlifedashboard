async function loadDashboardGames() {
  try {
    // === Load Recent Activity ===
    const recentRes = await fetch('/api/recent-games');
    const recentGames = await recentRes.json();

    const recentContainer = document.getElementById('recent-activity-container');
    const recentLoading = document.getElementById('recent-activity-loading');

    // Generate ascending "last played" days: 1 to 9
    const lastPlayedDays = Array.from({ length: 9 }, (_, i) => i + 1);

    recentContainer.innerHTML = recentGames.slice(0, 9).map((game, idx) => {
      const imgURL = game.cover?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : 'https://via.placeholder.com/60x80?text=No+Cover';

      const daysAgo = lastPlayedDays[idx];

      return `
        <div class="game-entry">
          <img class="game-cover tilt-effect" src="${imgURL}" alt="${game.name}" />
          <div class="game-info">
            <strong>${game.name}</strong>
            <em class="last-played-text">Last played: ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago</em>
          </div>
        </div>
      `;
    }).join('');

    recentLoading.style.display = 'none';
    recentContainer.style.display = 'flex';

    // === Load Game Library ===
    const libraryRes = await fetch('/api/games');
    const libraryGames = await libraryRes.json();

    const libraryGrid = document.getElementById('game-library-grid');
    const libraryLoading = document.getElementById('game-library-loading');

    libraryGrid.innerHTML = libraryGames.map(game => {
      const imgURL = game.cover?.url
        ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`
        : 'https://via.placeholder.com/264x374?text=No+Cover';

      return `
        <div class="library-game">
          <img class="library-cover tilt-effect" src="${imgURL}" alt="${game.name}" />
          <div class="library-title">${game.name}</div>
        </div>
      `;
    }).join('');

    libraryLoading.style.display = 'none';
    libraryGrid.style.display = 'grid';

    // Apply tilt effect
    VanillaTilt.init(document.querySelectorAll(".tilt-effect"), {
      max: 25,
      speed: 400,
      scale: 1.05,
      glare: true,
      "max-glare": 0.3,
      perspective: 1000
    });

  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

// === Dynamic Goal Management ===
function setupGoalManagement() {
  const goalList = document.getElementById('goal-list');
  const addGoalBtn = document.getElementById('add-goal-btn');

  if (!goalList || !addGoalBtn) return;

  addGoalBtn.addEventListener('click', () => {
    const li = document.createElement('li');
    li.className = 'goal-item';
    li.innerHTML = `
      <input type="checkbox" />
      <span contenteditable="true">New Goal</span>
      <button class="remove-goal-btn icon-button" title="Remove Goal">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon">
          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" x2="10" y1="11" y2="17"/>
          <line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
      </button>
    `;
    goalList.appendChild(li);
  });

  goalList.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-goal-btn');
    if (btn) {
      const li = btn.closest('li');
      if (li) li.remove();
    }
  });
}

// === Init on page load ===
window.addEventListener('DOMContentLoaded', () => {
  loadDashboardGames();
  setupGoalManagement();
});
