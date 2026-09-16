import dns from "node:dns";
import mongoose from "mongoose";

const configureMongoDns = () => {
  const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }
};

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MONGODB_URI is missing from your .env file");
  }

  return uri;
};

const connectDB = async () => {
  try {
    configureMongoDns();

    const conn = await mongoose.connect(getMongoUri(), {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);

    if (error.message.includes("querySrv")) {
      console.error(
        "MongoDB SRV DNS lookup failed. Check MONGODB_DNS_SERVERS or your system DNS settings.",
      );
    }

    if (error.message.includes("bad auth")) {
      console.error(
        "MongoDB Atlas rejected the credentials. Check the database username/password in MONGODB_URI.",
      );
    }

    process.exit(1);
  }
};

export default connectDB;
