'use strict';

/**
 * Seed Script — Workzarr
 * ----------------------
 * Creates: Admin, Customer, Provider users + categories.
 *
 * Usage:
 *   cd backend
 *   node scripts/seed.js
 *
 * Credentials after seeding:
 *   Admin:    admin@localserve.com   / admin123
 *   Customer: customer@test.com      / test123
 *   Provider: provider@test.com      / test123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// We import models AFTER env is loaded
const User = require('../models/User');
const Category = require('../models/Category');

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { name: 'Electrician',    icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/electrician.png', description: 'All electrical repairs and installations',   displayOrder: 1 },
  { name: 'Plumber',        icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/plumber.png',     description: 'Water leaks, pipe fixes and sanitation',      displayOrder: 2 },
  { name: 'AC Repair',      icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/ac.png',          description: 'AC service, gas charging and repair',          displayOrder: 3 },
  { name: 'Carpenter',      icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/carpenter.png',   description: 'Furniture repair and woodwork',                displayOrder: 4 },
  { name: 'Computer Repair',icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/pc.png',          description: 'Laptop and desktop troubleshooting',           displayOrder: 5 },
  { name: 'Tutor',          icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/tutor.png',       description: 'Home tuitions and academic support',           displayOrder: 6 },
  { name: 'Cleaner',        icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/cleaner.png',     description: 'Home and office cleaning services',            displayOrder: 7 },
  { name: 'Painter',        icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/painter.png',     description: 'Interior and exterior wall painting',          displayOrder: 8 },
  { name: 'Mechanic',       icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/mechanic.png',    description: 'Car and bike service at your doorstep',        displayOrder: 9 },
  { name: 'Home Nurse',     icon: 'https://res.cloudinary.com/demo/image/upload/v1/icons/nurse.png',       description: 'Elderly care and nursing at home',             displayOrder: 10 },
];

const USERS = [
  {
    email: 'admin@localserve.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    isProfileComplete: true,
  },
  {
    email: 'customer@test.com',
    password: 'test123',
    name: 'Test Customer',
    role: 'customer',
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    isProfileComplete: true,
  },
  {
    email: 'provider@test.com',
    password: 'test123',
    name: 'Test Provider',
    role: 'provider',
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    isProfileComplete: true,
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');

  // ── Drop old problematic indexes to avoid duplicate key errors ─────────────
  try {
    // Drop the old non-sparse referralCode index so our new sparse one can be created
    await mongoose.connection.collection('users').dropIndex('referralCode_1');
    console.log('🗑️  Dropped old referralCode_1 index');
  } catch (e) {
    // Index may not exist — that's fine
    if (e.codeName !== 'IndexNotFound') {
      console.log('ℹ️  referralCode_1 index not found (already clean)');
    }
  }

  // ── Seed Users ─────────────────────────────────────────────────────────────
  console.log('👤 Seeding users...');
  for (const userData of USERS) {
    // Hash the password manually so we bypass the pre-save hook
    // (which would hash an already-hashed password on findOneAndUpdate)
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await User.findOneAndUpdate(
      { email: userData.email },
      {
        ...userData,
        password: hashedPassword,
        // Explicitly leave referralCode undefined so the sparse index is happy
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`   ✔ ${userData.role.padEnd(10)} → ${userData.email}  (password: ${userData.password})`);
  }

  // ── Seed Categories ────────────────────────────────────────────────────────
  console.log('\n📂 Seeding categories...');
  for (const cat of CATEGORIES) {
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    await Category.findOneAndUpdate(
      { slug },
      { ...cat, slug, isActive: true },
      { upsert: true, new: true }
    );
    console.log(`   ✔ ${cat.name}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Admin login (admin portal → http://localhost:3001)');
  console.log('    Email   : admin@localserve.com');
  console.log('    Password: admin123');
  console.log('');
  console.log('  Customer login (user app → http://localhost:3000)');
  console.log('    Email   : customer@test.com');
  console.log('    Password: test123');
  console.log('');
  console.log('  Provider login (user app → http://localhost:3000)');
  console.log('    Email   : provider@test.com');
  console.log('    Password: test123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
