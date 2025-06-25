// api/recent-games.js
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

module.exports = async (req, res) => {
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
  } catch (err) {
    console.error('recent error:', err.response?.data || err.message);
    res.status(500).json({ error: 'cannot fetch recent' });
  }
};
