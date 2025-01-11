const { onRequest } = require("firebase-functions/v2/https");
const { MongoClient, ObjectId } = require("mongodb");
const logger = require("firebase-functions/logger");

// Retrieve MongoDB URI from Firebase environment variables
const uri = "mongodb+srv://admin:admin@flickit.jyikn.mongodb.net/footballApp?retryWrites=true&w=majority";
const client = new MongoClient(uri);

// Helper function to connect to MongoDB
async function connectToDatabase() {
  if (!client.isConnected) {
    await client.connect();
  }
  return client.db("footballApp");
}

// User Login Function
exports.login = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const { username, password } = req.body;

    const db = await connectToDatabase();
    const users = db.collection("Users");

    const user = await users.findOne({ username, password });

    if (user) {
      res.status(200).json({ message: "Login successful", userId: user._id });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    logger.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// User Registration Function
exports.register = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const { username, password } = req.body;

    const db = await connectToDatabase();
    const users = db.collection("Users");

    const existingUser = await users.findOne({ username });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
    } else {
      const newUser = await users.insertOne({ username, password, totalCounts: 0 });
      res.status(201).json({ message: "Registration successful", userId: newUser.insertedId });
    }
  } catch (error) {
    logger.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// **Get Drill Data (Authenticated)**
// **Get Drills for Authenticated User**
exports.getDrills = onRequest(async (req, res) => {
  logger.info("📩 Received request to fetch drills");

  if (req.method !== "POST") {
    logger.warn("🚫 Method Not Allowed");
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { userId } = req.body;
    logger.info(`📌 User ID received: ${userId}`);

    if (!userId || userId.length !== 24) {
      logger.warn("⚠️ Invalid user ID format");
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const db = await connectToDatabase();
    const users = db.collection("Users");
    const drills = db.collection("Drills");

    logger.info(`🔍 Checking if user ${userId} exists`);
    const user = await users.findOne({ _id: new ObjectId(userId) });
    logger.info(`here is the fetched user ${user}`);
    if (!user) {
      logger.warn("🚫 Unauthorized access: User not found");
      return res.status(401).json({ message: "Unauthorized access" });
    }

    logger.info("📡 Fetching drills data...");
    const drillData = await drills.find().toArray();

    logger.info(`✅ Successfully retrieved ${drillData.length} drills`);
    return res.status(200).json(drillData);
  } catch (error) {
    logger.error("❌ Error fetching drills:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});