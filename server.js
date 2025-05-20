const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { Resend } = require("resend");
require("dotenv").config();

const app = express();
const PORT = 5000;

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "C:/Users/Public/uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

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
  rollNo: String,
  phone: String,
  department: String,
  idCard: String,
  verified: { type: Boolean, default: false },
  resetToken: String,
  resetTokenExpiry: Date,
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

app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "forgot-password.html"));
});

app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reset-password.html"));
});

// Register with OTP send
app.post("/api/register", upload.single("idCard"), async (req, res) => {
  const { username, email, password, rollNo, phone, department } = req.body;
  const idCard = req.file ? "/uploads/" + req.file.filename : null;

  if (
    !username ||
    !email ||
    !password ||
    !rollNo ||
    !phone ||
    !department ||
    !idCard
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Email already registered." });

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = Date.now() + 5 * 60 * 1000;

  otpStore[email] = {
    username,
    password: hashedPassword,
    otp,
    expiry,
    rollNo,
    phone,
    department,
    idCard,
  };

  try {
    await resend.emails.send({
      from: "Auth System <onboarding@resend.dev>",
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

  if (!record) {
    return res
      .status(400)
      .json({ message: "No OTP request found for this email." });
  }

  if (Date.now() > record.expiry) {
    return res.status(400).json({ message: "OTP has expired." });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  const user = new User({
    username: record.username,
    email,
    password: record.password,
    rollNo: record.rollNo,
    phone: record.phone,
    department: record.department,
    idCard: record.idCard,
    verified: true,
  });

  await user.save();
  delete otpStore[email];

  res.json({ message: "Registration complete. You can now log in." });
});

// Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (!user.verified) {
    return res.status(401).json({ message: "Please verify your email first." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json({ message: `Welcome, ${user.username}!` });
});

// Forgot password
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  const resetUrl = `http://localhost:${PORT}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: "Auth System <onboarding@resend.dev>",
      to: email,
      subject: "Password Reset Request",
      text: `Click this link to reset your password: ${resetUrl}`,
    });

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    res.status(500).json({ message: "Failed to send reset email." });
  }
});

// Reset password
app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token and new password are required." });
  }

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.json({
    message:
      "Password updated successfully. You can now login with your new password.",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
