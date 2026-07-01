import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("Missing MONGO_URI environment variable.");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In dev, Next.js hot-reloads modules, which would otherwise open a new
  // connection on every reload. Cache the client on the global object.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect().catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      global._mongoClientPromise = undefined;
      throw err;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect().catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    throw err;
  });
}

export default clientPromise;
