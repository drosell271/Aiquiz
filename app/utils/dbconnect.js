const mongoose = require("mongoose");
const logger = require('./logger').create('DATABASE');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env file");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  logger.debug("Connecting to database...");
  if (cached.conn) {
    logger.debug("Using existing connection");
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    logger.info("Creating new connection", { uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@') });
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      logger.success("MongoDB connected successfully");
      return mongoose;
    }).catch((error) => {
      logger.error("MongoDB connection failed", { error: error.message });
      cached.promise = null;
      throw error;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    logger.error("Error connecting to database", { error: e.message });
    throw new Error(`Database connection failed: ${e.message}`);
  }
  return cached.conn;
}

module.exports = dbConnect;