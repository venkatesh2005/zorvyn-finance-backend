require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Record = require("../models/record.model");

const connectDB = require("../config/db");

const CATEGORIES = [
  "salary", "freelance", "investment", "sales",
  "rent", "utilities", "food", "transport",
  "healthcare", "education", "entertainment", "other",
];

const randomBetween = (min, max) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(2));

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateRecords = (userId, count = 40) => {
  const records = [];
  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.4 ? "expense" : "income";
    const incomeCategories = ["salary", "freelance", "investment", "sales"];
    const expenseCategories = ["rent", "utilities", "food", "transport", "healthcare", "education", "entertainment", "other"];
    const category = type === "income"
      ? randomItem(incomeCategories)
      : randomItem(expenseCategories);

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 180)); // last 6 months

    records.push({
      amount: type === "income" ? randomBetween(5000, 80000) : randomBetween(100, 15000),
      type,
      category,
      date,
      description: `Sample ${type} - ${category} entry #${i + 1}`,
      createdBy: userId,
    });
  }
  return records;
};

const seed = async () => {
  await connectDB();

  console.log("🌱 Seeding database...");

  // Clear existing data
  await User.deleteMany({});
  await Record.deleteMany({});

  // Create users
  const admin = await User.create({
    name: "Admin User",
    email: "admin@finance.com",
    password: "admin123",
    role: "admin",
    status: "active",
  });

  const analyst = await User.create({
    name: "Analyst User",
    email: "analyst@finance.com",
    password: "analyst123",
    role: "analyst",
    status: "active",
  });

  await User.create({
    name: "Viewer User",
    email: "viewer@finance.com",
    password: "viewer123",
    role: "viewer",
    status: "active",
  });

  // Create financial records
  const adminRecords = generateRecords(admin._id, 30);
  const analystRecords = generateRecords(analyst._id, 20);
  await Record.insertMany([...adminRecords, ...analystRecords]);

  console.log("\Seeding complete!\n");
  console.log("-------------------------------------");
  console.log("  Test Credentials:");
  console.log("--------------------------------------");
  console.log("  Admin    → admin@finance.com    / admin123");
  console.log("  Analyst  → analyst@finance.com  / analyst123");
  console.log("  Viewer   → viewer@finance.com   / viewer123");
  console.log("-------------------------------------\n");

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
