import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not set.");
}

const dbName =
  process.env.MONGODB_DB ||
  new URL(uri).pathname.replace("/", "") ||
  "default";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);
const clientPromise =
  global._mongoClientPromise || client.connect().then((c) => c);

if (process.env.NODE_ENV !== "production") {
  global._mongoClientPromise = clientPromise;
}

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
