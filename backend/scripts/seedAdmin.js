'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI;
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB...");

  const hash = await bcrypt.hash('admin123', 10);

  await User.findOneAndUpdate(
    { email: 'admin@localserve.com' },
    {
      name: 'Super Admin',
      email: 'admin@localserve.com',
      phone: '9999999999',
      role: 'admin',
      password: hash,
      isPhoneVerified: true,
      isActive: true,
      referralCode: 'ADMIN001'
    },
    { upsert: true, new: true }
  );

  console.log("✅ Admin created successfully!");
  console.log("Email: admin@localserve.com");
  console.log("Password: admin123");
  process.exit(0);
}

seedAdmin().catch(e => { console.error("❌ Failed:", e); process.exit(1); });
