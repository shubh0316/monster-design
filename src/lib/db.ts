import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB ?? 'monster-design-email';

let client: MongoClient;
let db: Db;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

export async function getDb(): Promise<Db> {
  if (db) return db;

  // Reuse connection in dev (hot reload creates new module instances)
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(uri);
      await global._mongoClient.connect();
    }
    client = global._mongoClient;
  } else {
    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
    }
  }

  db = client.db(dbName);

  // Ensure unique index on contacts.email
  await db.collection('contacts').createIndex({ email: 1 }, { unique: true });

  return db;
}
