// api/all-games.js
const axios = require('axios');

let accessToken = '';

async function getAccessToken() {
  const resp = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'client_credentials',
    },
  });
  accessToken = resp.data.access_token;
}

async function ensureAccessToken() {
  if (!accessToken) {
    await getAccessToken();
  }
}

function igdbQuery(limit) {
  const franchises = [
    'mario', 'zelda', 'metroid', 'animal crossing',
    'pokemon', 'kirby', 'donkey kong', 'splatoon',
    'fire emblem', 'super smash bros',
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

module.exports = async (req, res) => {
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
  } catch (err) {
    console.error('all-games error:', err.response?.data || err.message);
    res.status(500).json({ error: 'cannot fetch all games' });
  }
};
