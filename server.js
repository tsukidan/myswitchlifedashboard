const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, 'src')));

let accessToken = '';

// === Token Management ===
async function getAccessToken() {
  try {
    const resp = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
    });
    accessToken = resp.data.access_token;
    console.log('Access token obtained.');
  } catch (e) {
    console.error('Token fetch error:', e.response?.data || e.message);
  }
}

async function ensureAccessToken() {
  if (!accessToken) {
    await getAccessToken();
  }
}

// === IGDB Query Builder ===
function igdbQuery(limit) {
  const franchises = [
    'mario', 'zelda', 'metroid', 'animal crossing',
    'pokemon', 'kirby', 'donkey kong', 'splatoon',
    'fire emblem', 'super smash bros'
  ];
  const nameFilter = franchises.map(k => `name ~ *"${k}"*`).join(' | ');
  return `
    fields name, cover.url, first_release_date, summary;
    where platforms=(130)
      & cover != null
      & age_ratings.rating != (6)
      & (${nameFilter});
    sort aggregated_rating desc;
    limit ${limit};
  `;
}

// === API Routes ===

// Game library (30 games)
app.get('/api/games', async (req, res) => {
  try {
    await ensureAccessToken();
    const igdb = igdbQuery(30);
    const resp = await axios.post(
      'https://api.igdb.com/v4/games',
      igdb,
      {
        headers: {
          'Client-ID': process.env.CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
        },
      }
    );
    if (!Array.isArray(resp.data)) throw new Error('Invalid IGDB response');
    res.json(resp.data);
  } catch (e) {
    console.error('games error:', e.response?.data || e.message);
    res.status(500).json({ error: 'cannot fetch library' });
  }
});

// All games (100 games)
app.get('/api/all-games', async (req, res) => {
  try {
    await ensureAccessToken();
    const igdb = igdbQuery(100);
    const resp = await axios.post(
      'https://api.igdb.com/v4/games',
      igdb,
      {
        headers: {
          'Client-ID': process.env.CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
        },
      }
    );
    if (!Array.isArray(resp.data)) throw new Error('Invalid IGDB response');
    res.json(resp.data);
  } catch (e) {
    console.error('all-games error:', e.response?.data || e.message);
    res.status(500).json({ error: 'cannot fetch all games' });
  }
});

// Recent games (Mario-related)
app.get('/api/recent-games', async (req, res) => {
  try {
    await ensureAccessToken();
    const query = `
      fields name, cover.image_id, aggregated_rating;
      where platforms=(130)
        & cover != null
        & age_ratings.rating != (6)
        & name ~ *"mario"*;
      sort aggregated_rating desc;
      limit 20;
    `;
    const resp = await axios.post(
      'https://api.igdb.com/v4/games',
      query,
      {
        headers: {
          'Client-ID': process.env.CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
        },
      }
    );
    if (!Array.isArray(resp.data)) throw new Error('Invalid IGDB response');
    res.json(resp.data);
  } catch (e) {
    console.error('recent error:', e.response?.data || e.message);
    res.status(500).json({ error: 'cannot fetch recent' });
  }
});

// Start server
app.listen(3000, async () => {
  await getAccessToken();
  console.log('Server listening at http://localhost:3000');
});
