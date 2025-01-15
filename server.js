const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.db_connection);

// Middleware to parse JSON body
app.use(express.json());

async function connectDb() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectDb();
const db = client.db("user");
const userCollection = db.collection("login-credentials");

// Root route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Login Api"
    });
});

// Signup route
app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please provide all fields" });
    }

    try {
        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const newUser = {
            name,
            email,
            password
        };

        await userCollection.insertOne(newUser);

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.log("Error during signup:", err);
        res.status(500).json({ message: "Something went wrong" });
    }
});

// Login route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please provide email and password" });
    }

    try {
        const user = await userCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compare the provided password with the stored plain-text password
        if (password !== user.password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.status(200).json({ message: "Login successful" });
    } catch (err) {
        console.log("Error during login:", err);
        res.status(500).json({ message: "Something went wrong" });
    }
});

// Start the server
app.listen(process.env.port, () => {
    console.log(`Server is running on port ${process.env.port}`);
});
