// src/js/modal.js
// Handles opening/closing the game-detail modal and draws cover + empty case correctly.

document.addEventListener('DOMContentLoaded', () => {
  const grid        = document.getElementById('game-library-grid');
  const modal       = document.getElementById('game-modal');
  const closeBtn    = document.getElementById('modal-close');
  const canvas      = document.getElementById('case-canvas');
  const ctx         = canvas.getContext('2d');
  const titleElem   = document.getElementById('modal-title');
  const releaseEl   = document.getElementById('modal-release');
  const summaryEl   = document.getElementById('modal-summary');
  const bottomTitle = document.getElementById('modal-title-bottom');

  // Preload the empty case overlay
  const emptyImg = new Image();
  emptyImg.src = '/img/emptybox.png';

  grid.addEventListener('click', e => {
    if (e.target.closest('.remove-game-btn')) return;  // ignore deletes
    const card = e.target.closest('.library-game');
    if (!card) return;

    // 1) Populate text fields
    const name    = card.dataset.name    || '';
    const release = card.dataset.release || 'Unknown';
    const summary = card.dataset.summary || 'No description available.';
    titleElem.textContent   = name;
    bottomTitle.textContent = name;
    releaseEl.textContent   = `Release date: ${release}`;
    summaryEl.textContent   = summary;

    // 2) Load the game-cover and draw under the empty case
    const coverURL = card.dataset.cover;
    const coverImg = new Image();
    coverImg.crossOrigin = 'anonymous';
    coverImg.src = coverURL;
    coverImg.onload = () => {
      // once both images are ready, draw:
      const drawBoth = () => {
        // size canvas to overlay's natural size
        canvas.width  = emptyImg.naturalWidth;
        canvas.height = emptyImg.naturalHeight;

        // clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw cover art underneath.
        // adjust these paddings so the art fits perfectly in your case window
        const PAD_X = 30;
        const PAD_Y = 48;
        const WIN_W = canvas.width  - PAD_X * 2;
        const WIN_H = canvas.height - PAD_Y * 2;
        ctx.drawImage(coverImg, PAD_X, PAD_Y, WIN_W, WIN_H);

        // then draw the empty case overlay on top
        ctx.drawImage(emptyImg, 0, 0, canvas.width, canvas.height);
      };

      if (emptyImg.complete) {
        drawBoth();
      } else {
        emptyImg.onload = drawBoth;
      }
    };

    // 3) Show modal
    modal.classList.add('open');
  });

  // close handlers
  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
  });
});
