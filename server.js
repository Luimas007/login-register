const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");
const { Resend } = require("resend");
require("dotenv").config(); // Load .env file

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/auth_demo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// User model
const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  verified: { type: Boolean, default: false },
});

const User = mongoose.model("User", UserSchema);

// In-memory OTP store
let otpStore = {};

// Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Register with OTP send
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.json({ message: "All fields are required." });

  const existing = await User.findOne({ email });
  if (existing) return res.json({ message: "Email already registered." });

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = Date.now() + 5 * 60 * 1000;

  otpStore[email] = { username, password: hashedPassword, otp, expiry };

  try {
    await resend.emails.send({
      from: "Auth System <onboarding@resend.dev>", // Default sender
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    res.status(500).json({ message: "Failed to send OTP." });
  }
});

// OTP Verification
app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record)
    return res.json({ message: "No OTP request found for this email." });

  if (Date.now() > record.expiry)
    return res.json({ message: "OTP has expired." });

  if (record.otp !== otp) return res.json({ message: "Invalid OTP." });

  const user = new User({
    username: record.username,
    email,
    password: record.password,
    verified: true,
  });

  await user.save();
  delete otpStore[email];

  res.json({ message: "Registration complete. You can now log in." });
});

// Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.json({ message: "All fields are required." });

  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "Invalid email or password." });

  if (!user.verified)
    return res.json({ message: "Please verify your email first." });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.json({ message: "Invalid email or password." });

  res.json({ message: `Welcome, ${user.username}!` });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
