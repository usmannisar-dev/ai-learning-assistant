// ============================================================
// MONGODB DATABASE CONNECTION
// ============================================================

import dns from "node:dns";
import mongoose from "mongoose";

// ============================================================
// MONGODB CONNECTION CACHE
// ============================================================

let cachedConnection = null;

// ============================================================
// CONFIGURE MONGODB DNS SERVERS
// ============================================================

const configureMongoDns = () => {
  const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }
};

// ============================================================
// GET MONGODB URI
// ============================================================

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MONGODB_URI is missing from environment variables.");
  }

  return uri;
};

// ============================================================
// CONNECT TO MONGODB
// ============================================================

const connectDB = async () => {
  // ==========================================================
  // USE EXISTING CACHED CONNECTION
  // ==========================================================

  if (cachedConnection) {
    return cachedConnection;
  }

  // ==========================================================
  // CHECK IF MONGOOSE IS ALREADY CONNECTED
  // ==========================================================

  if (mongoose.connection.readyState === 1) {
    cachedConnection = mongoose.connection;

    return cachedConnection;
  }

  // ==========================================================
  // CONNECT TO MONGODB
  // ==========================================================

  try {
    configureMongoDns();

    const conn = await mongoose.connect(getMongoUri(), {
      serverSelectionTimeoutMS: 10000,
    });

    cachedConnection = conn.connection;

    console.log(`MongoDB connected: ${conn.connection.host}`);

    return cachedConnection;
  } catch (error) {
    // ========================================================
    // LOG DATABASE ERROR
    // ========================================================

    console.error(`MongoDB connection error: ${error.message}`);

    // ========================================================
    // DNS ERROR
    // ========================================================

    if (error.message.includes("querySrv")) {
      console.error(
        "MongoDB SRV DNS lookup failed. Check MongoDB Atlas DNS/network settings.",
      );
    }

    // ========================================================
    // AUTHENTICATION ERROR
    // ========================================================

    if (error.message.toLowerCase().includes("bad auth")) {
      console.error(
        "MongoDB Atlas rejected the credentials. Check your MongoDB username and password.",
      );
    }

    // ========================================================
    // IMPORTANT:
    // DO NOT USE process.exit() HERE.
    // VERCEL SERVERLESS FUNCTIONS SHOULD NOT TERMINATE
    // THE ENTIRE PROCESS WHEN A DATABASE REQUEST FAILS.
    // ========================================================

    throw error;
  }
};

// ============================================================
// EXPORT
// ============================================================

export default connectDB;
