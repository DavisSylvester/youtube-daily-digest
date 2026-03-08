import { MongoClient, type Db } from 'mongodb';

let client: MongoClient | null = null;

export async function getMongo(): Promise<Db> {
  if (!client) {
    const uri = Bun.env['MONGO_URI'];
    if (!uri) throw new Error('MONGO_URI is not set');
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(Bun.env['MONGO_DB'] ?? 'youtube-daily-digest');
}

export async function closeMongo(): Promise<void> {
  await client?.close();
  client = null;
}
