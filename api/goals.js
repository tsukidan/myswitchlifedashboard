// api/goals.js
const { MongoClient, ObjectId } = require('mongodb');

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
    collection = db.collection('goals');
  }
  return collection;
}

module.exports = async (req, res) => {
  const col = await getCollection();

  switch (req.method) {
    case 'GET':
      {
        // Return all goals
        const all = await col.find({}).toArray();
        res.status(200).json(all);
      }
      break;

    case 'POST':
      {
        // Expect both text and gameId
        const { text, gameId } = req.body;
        if (!text || typeof text !== 'string' || !gameId) {
          return res
            .status(400)
            .json({ error: 'Missing or invalid `text` or `gameId`' });
        }
        const doc = {
          text,
          gameId: String(gameId),
          done: false,
          createdAt: new Date(),
        };
        const result = await col.insertOne(doc);
        // include the new _id in response
        res.status(201).json({ ...doc, _id: result.insertedId });
      }
      break;

    case 'DELETE':
      {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'No `id` provided' });
        }
        await col.deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({ success: true });
      }
      break;

    case 'PATCH':
      {
        // Toggle done
        const { id, done } = req.body;
        if (!id || typeof done !== 'boolean') {
          return res
            .status(400)
            .json({ error: 'Missing `id` or invalid `done`' });
        }
        await col.updateOne(
          { _id: new ObjectId(id) },
          { $set: { done } }
        );
        res.status(200).json({ success: true });
      }
      break;

    default:
      res.setHeader('Allow', 'GET,POST,DELETE,PATCH');
      res.status(405).end();
  }
};
