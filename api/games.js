// api/games.js
const { MongoClient } = require('mongodb');

let client;
let collection;
async function getCollection() {
  if (!collection) {
    client = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    const db = client.db('myswitchlife');
    collection = db.collection('library');
  }
  return collection;
}

module.exports = async (req, res) => {
  const col = await getCollection();

  if (req.method === 'GET') {
    const games = await col.find({}).toArray();
    return res.status(200).json(games);
  }

  if (req.method === 'POST') {
    const { id, name, cover, summary, first_release_date, last_played } = req.body;
    if (!id || !name || !cover) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    await col.updateOne(
      { id },
      {
        $set: {
          id,
          name,
          cover,
          summary,
          first_release_date,
          // default last_played to today if none provided
          last_played: last_played || new Date().toISOString().split('T')[0]
        }
      },
      { upsert: true }
    );
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id, 10);
    if (!id) {
      return res.status(400).json({ error: 'No ID provided' });
    }
    await col.deleteOne({ id });
    return res.status(200).json({ success: true });
  }

  // Fallback for unsupported methods
  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};
