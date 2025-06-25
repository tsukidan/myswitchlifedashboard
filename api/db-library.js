export async function GET(req) {
  const client = await clientPromise;
  const db = client.db('myswitchlife');
  const collection = db.collection('library');
  const games = await collection.find({}).toArray();
  return new Response(JSON.stringify(games), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  const client = await clientPromise;
  const db = client.db('myswitchlife');
  const collection = db.collection('library');
  const body = await req.json();
  const { id, name, cover } = body;
  if (!id || !name || !cover?.url) {
    return new Response(JSON.stringify({ error: 'Invalid data' }), {
      status: 400,
    });
  }
  await collection.updateOne({ id }, { $set: { id, name, cover } }, { upsert: true });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(req) {
  const client = await clientPromise;
  const db = client.db('myswitchlife');
  const collection = db.collection('library');
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'No ID provided' }), { status: 400 });
  }
  await collection.deleteOne({ id: parseInt(id) });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
