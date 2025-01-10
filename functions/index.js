const { onRequest } = require("firebase-functions/v2/https");
const { MongoClient } = require("mongodb");
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
