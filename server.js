// server.js
const express = require('express');
const axios   = require('axios');
const dotenv  = require('dotenv');
const cors    = require('cors');
const path    = require('path');
const { MongoClient } = require('mongodb');

// load env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === MongoDB Setup ===
const client = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let libraryCollection;

async function connectToMongo() {
  await client.connect();
  const db = client.db('myswitchlife');
  libraryCollection = db.collection('library');
  console.log('✅ MongoDB connected');
}

// === Twitch/IGDB Token Management ===
let accessToken = '';
async function getAccessToken() {
  try {
    const resp = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      null,
      {
        params: {
          client_id:     process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type:    'client_credentials',
        },
      }
    );
    accessToken = resp.data.access_token;
    console.log('✅ Access token obtained.');
  } catch (e) {
    console.error('❌ Token fetch error:', e.response?.data || e.message);
  }
}
async function ensureAccessToken() {
  if (!accessToken) await getAccessToken();
}

// Build IGDB query
function igdbQuery(limit) {
  const franchises = [
    'mario','zelda','metroid','animal crossing',
    'pokemon','kirby','donkey kong','splatoon',
    'fire emblem','super smash bros',
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

// === Library Routes (MongoDB) ===
app.get('/api/games', async (req, res) => {
  try {
    const games = await libraryCollection.find({}).toArray();
    res.status(200).json(games);
  } catch (e) {
    console.error('❌ /api/games GET error:', e);
    res.status(500).json({ error: 'Failed to fetch library' });
  }
});

app.post('/api/games', async (req, res) => {
  try {
    const { id, name, cover, summary, first_release_date, last_played } = req.body;
    if (!id || !name || !cover) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    await libraryCollection.updateOne(
      { id },
      {
        $set: {
          id, name, cover, summary, first_release_date,
          last_played: last_played || new Date().toISOString().split('T')[0],
        },
      },
      { upsert: true }
    );
    res.status(200).json({ success: true });
  } catch (e) {
    console.error('❌ /api/games POST error:', e);
    res.status(500).json({ error: 'Failed to save game' });
  }
});

app.delete('/api/games', async (req, res) => {
  try {
    const id = parseInt(req.query.id, 10);
    if (!id) return res.status(400).json({ error: 'No ID provided' });
    await libraryCollection.deleteOne({ id });
    res.status(200).json({ success: true });
  } catch (e) {
    console.error('❌ /api/games DELETE error:', e);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

// === IGDB Proxy Routes ===
app.get('/api/all-games', async (req, res) => {
  try {
    await ensureAccessToken();
    const query = igdbQuery(100);
    const igdbRes = await axios.post(
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
    res.status(200).json(igdbRes.data);
  } catch (e) {
    console.error('❌ /api/all-games error:', e.response?.data || e.message);
    res.status(500).json({ error: 'Cannot fetch all games' });
  }
});

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
    const igdbRes = await axios.post(
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
    res.status(200).json(igdbRes.data);
  } catch (e) {
    console.error('❌ /api/recent-games error:', e.response?.data || e.message);
    res.status(500).json({ error: 'Cannot fetch recent' });
  }
});

// === Goals Routes ===
// mount your existing serverless handler:
const goalsHandler = require('./api/goals.js');
app.all('/api/goals', goalsHandler);

// serve front‐end
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Start Server ===
async function start() {
  await getAccessToken();
  await connectToMongo();
  app.listen(3000, () => {
    console.log('🟢 Server running at http://localhost:3000');
  });
}

start();
