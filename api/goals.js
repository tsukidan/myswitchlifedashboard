// api/goals.js
const { MongoClient, ObjectId } = require('mongodb');

let client;
let collection;

async function getCollection() {
  if (!collection) {
    client = new MongoClient(process.env.MONGODB_URI);
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
        const all = await col.find({}).toArray();
        res.status(200).json(all);
      }
      break;

    case 'POST':
      {
        const { text } = req.body;
        if (!text || typeof text !== 'string') {
          return res.status(400).json({ error: 'Missing or invalid `text` field' });
        }
        const result = await col.insertOne({ text, done: false, createdAt: new Date() });
        res.status(201).json({ ...result.ops[0], _id: result.insertedId });
      }
      break;

    case 'DELETE':
      {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'No `id` provided' });
        await col.deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({ success: true });
      }
      break;

    case 'PATCH':
      {
        const { id, done } = req.body;
        if (!id || typeof done !== 'boolean') {
          return res.status(400).json({ error: 'Missing `id` or invalid `done`' });
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
