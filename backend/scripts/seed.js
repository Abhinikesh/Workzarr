'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

const SEED_DATA = {
  admin: {
    name: "Super Admin",
    phone: "9999999999",
    email: "admin@localserve.com",
    role: "admin",
    isPhoneVerified: true,
    isActive: true
  },
  customer: {
    name: "Test Customer",
    phone: "8888888888",
    role: "customer",
    isPhoneVerified: true,
    isActive: true
  },
  provider: {
    name: "Test Provider",
    phone: "7777777777",
    role: "provider",
    isPhoneVerified: true,
    isActive: true
  },
  categories: [
    { name: "Electrician", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/electrician.png", description: "All electrical repairs and installations", displayOrder: 1 },
    { name: "Plumber", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/plumber.png", description: "Water leaks, pipe fixes and sanitation", displayOrder: 2 },
    { name: "AC Repair", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/ac.png", description: "AC service, gas charging and repair", displayOrder: 3 },
    { name: "Carpenter", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/carpenter.png", description: "Furniture repair and woodwork", displayOrder: 4 },
    { name: "Computer Repair", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/pc.png", description: "Laptop and desktop troubleshooting", displayOrder: 5 },
    { name: "Tutor", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/tutor.png", description: "Home tuitions and academic support", displayOrder: 6 },
    { name: "Cleaner", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/cleaner.png", description: "Home and office cleaning services", displayOrder: 7 },
    { name: "Painter", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/painter.png", description: "Interior and exterior wall painting", displayOrder: 8 },
    { name: "Mechanic", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/mechanic.png", description: "Car and bike service at your doorstep", displayOrder: 9 },
    { name: "Home Nurse", icon: "https://res.cloudinary.com/demo/image/upload/v1/icons/nurse.png", description: "Elderly care and nursing at home", displayOrder: 10 }
  ]
};

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in .env file");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    // 1. Seed Admin
    await User.findOneAndUpdate(
      { phone: SEED_DATA.admin.phone },
      SEED_DATA.admin,
      { upsert: true, new: true }
    );
    console.log("Admin seeded.");

    // 2. Seed Categories
    const categories = [];
    for (const cat of SEED_DATA.categories) {
      const slug = cat.name.toLowerCase().replace(/ /g, '-');
      const category = await Category.findOneAndUpdate(
        { slug },
        { ...cat, slug, isActive: true },
        { upsert: true, new: true }
      );
      categories.push(category);
    }
    console.log("Categories seeded.");

    // 3. Seed Customer
    const customerUser = await User.findOneAndUpdate(
      { phone: SEED_DATA.customer.phone },
      SEED_DATA.customer,
      { upsert: true, new: true }
    );
    console.log("Customer seeded.");

    // 4. Seed Provider
    const providerUser = await User.findOneAndUpdate(
      { phone: SEED_DATA.provider.phone },
      SEED_DATA.provider,
      { upsert: true, new: true }
    );

    const electricianCat = categories.find(c => c.name === "Electrician");
    const providerProfile = await Provider.findOneAndUpdate(
      { userId: providerUser._id },
      {
        userId: providerUser._id,
        businessName: "Test Electric Co",
        category: electricianCat._id,
        description: "Professional electrical services since 2010",
        address: {
          street: "Main St",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
          coordinates: [77.2090, 28.6139]
        },
        isVerified: true,
        isActive: true,
        onboardingStep: 'completed',
        isProfileComplete: true
      },
      { upsert: true, new: true }
    );
    console.log("Provider seeded.");

    // 5. Seed Services
    const services = [
      { title: "Switch Repair", price: 200, priceType: "fixed", duration: 30 },
      { title: "Full House Wiring", price: 5000, priceType: "starting", duration: 480 },
      { title: "Fan Installation", price: 350, priceType: "fixed", duration: 45 }
    ];

    for (const svc of services) {
      await Service.findOneAndUpdate(
        { provider: providerProfile._id, title: svc.title },
        { ...svc, provider: providerProfile._id, category: electricianCat._id, isActive: true },
        { upsert: true }
      );
    }
    console.log("Services seeded.");

    // 6. Seed a Booking
    const firstService = await Service.findOne({ provider: providerProfile._id });
    await Booking.findOneAndUpdate(
      { customer: customerUser._id, provider: providerProfile._id, service: firstService._id },
      {
        bookingId: "BK" + Date.now(),
        customer: customerUser._id,
        provider: providerProfile._id,
        service: firstService._id,
        scheduledDate: new Date(),
        timeSlot: "10:00 AM - 11:00 AM",
        amount: firstService.price,
        status: "completed",
        paymentStatus: "paid",
        address: {
          fullAddress: "123, Test Lane, Delhi",
          coordinates: [77.2090, 28.6139]
        }
      },
      { upsert: true }
    );
    console.log("Sample booking seeded.");

    console.log("\n✅ Seeding complete!");
    console.log("Admin login OTP phone: 9999999999");
    console.log("Customer OTP phone: 8888888888");
    console.log("Provider OTP phone: 7777777777");
    console.log("In dev mode, check logs for OTP");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
