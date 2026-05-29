/**
 * Workzarr Seed Script
 * Run: node scripts/seed.js
 *
 * Inserts: 8 categories, 20 users, 15 providers, services, 30 bookings, 10 payments
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Models ──────────────────────────────────────────────────────────────────
const User     = require('../models/User');
const Category = require('../models/Category');
const Provider = require('../models/Provider');
const Service  = require('../models/Service');
const Booking  = require('../models/Booking');
const Payment  = require('../models/Payment');

// ── Helpers ──────────────────────────────────────────────────────────────────
const rand   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randN  = (min, max) => +(Math.random() * (max - min) + min).toFixed(1);
const randInt= (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const phone  = () => `${randInt(7000000000, 9999999999)}`;

// ── Data ─────────────────────────────────────────────────────────────────────
const CITIES = ['Faridabad', 'Gurgaon', 'Noida', 'Delhi', 'Barasat'];
const STATES = {
  'Faridabad': 'Haryana', 'Gurgaon': 'Haryana',
  'Noida': 'Uttar Pradesh', 'Delhi': 'Delhi', 'Barasat': 'West Bengal',
};

const INDIAN_NAMES = [
  'Ravi Kumar',    'Priya Sharma',   'Amit Singh',    'Sunita Devi',
  'Deepak Yadav',  'Pooja Gupta',    'Rahul Verma',   'Anita Patel',
  'Suresh Nair',   'Kavita Joshi',   'Manoj Tiwari',  'Rekha Mishra',
  'Anil Chauhan',  'Neha Aggarwal',  'Vijay Rawat',   'Meena Pandey',
  'Sanjay Dubey',  'Lata Yadav',     'Rajesh Bose',   'Geeta Singh',
];

const PROVIDER_NAMES = [
  'Mukesh Electricals', 'Hari Plumber Works',  'Lakshmi Carpentry',
  'Cool Breeze AC Services', 'Sharma Tuition Hub', 'PC Fix Wala',
  'Colour Craft Painters', 'Moto Singh Mechanic', 'Ram Electricals',
  'Ganesh Plumbing Co.',  'Patel Woodworks',  'Arctic Cool AC',
  'Bright Minds Tutor', 'TechFix Pro', 'Wall Masters',
];

const CATEGORIES_DATA = [
  { name: 'Electrician',     slug: 'electrician',     icon: '⚡', description: 'Wiring, repairs, installation' },
  { name: 'Plumber',         slug: 'plumber',         icon: '🔧', description: 'Pipe fitting, leaks, drainage' },
  { name: 'Carpenter',       slug: 'carpenter',       icon: '🪚', description: 'Furniture, doors, wood repair' },
  { name: 'AC Repair',       slug: 'ac-repair',       icon: '❄️', description: 'Servicing, gas refill, installation' },
  { name: 'Tutor',           slug: 'tutor',           icon: '📚', description: 'Home tuition, all subjects' },
  { name: 'Computer Repair', slug: 'computer-repair', icon: '💻', description: 'Laptop, PC, networking' },
  { name: 'Painter',         slug: 'painter',         icon: '🎨', description: 'Interior, exterior, waterproofing' },
  { name: 'Mechanic',        slug: 'mechanic',        icon: '🔩', description: 'Two-wheeler, car, engine repair' },
];

const BOOKING_STATUSES = ['pending', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled'];
const PAYMENT_METHODS  = ['cash', 'upi', 'card'];

// ── Main ─────────────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected\n');

    // ── 1. Drop old data ──────────────────────────────────────────────────
    console.log('🗑  Clearing existing seed collections...');
    await Promise.all([
      User.deleteMany({ role: { $ne: 'admin' } }),   // keep admin accounts
      Category.deleteMany({}),
      Provider.deleteMany({}),
      Service.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
    ]);
    // Drop legacy referralCode index to avoid E11000 collisions
    try {
      await mongoose.connection.collection('users').dropIndex('referralCode_1');
      console.log('   Dropped legacy referralCode_1 index');
    } catch (_) {}
    console.log('   Done.\n');

    // ── Create Admin if not present ───────────────────────────────────────
    const adminEmail = 'admin@localserve.com';
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      console.log('👑 Seeding admin user...');
      const adminPw = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin Workzarr',
        email: adminEmail,
        password: adminPw,
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        isProfileComplete: true
      });
      console.log('   Admin created.\n');
    }

    // ── 2. Categories ─────────────────────────────────────────────────────
    console.log('📂 Seeding categories...');
    const categories = await Category.insertMany(
      CATEGORIES_DATA.map(c => ({ ...c, isActive: true }))
    );
    console.log(`   ✅ ${categories.length} categories created\n`);

    // ── 3. Users (customers) ──────────────────────────────────────────────
    console.log('👤 Seeding users...');
    const hashedPw = await bcrypt.hash('user1234', 10);
    const city     = () => rand(CITIES);

    const usersData = INDIAN_NAMES.map((name, i) => {
      const c = city();
      return {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}${i + 1}@example.com`,
        phone: phone(),
        password: hashedPw,
        role: 'customer',
        isActive: true,
        isBlocked: false,
        isPhoneVerified: true,
        isProfileComplete: true,
        location: { town: c, district: c, state: STATES[c] },
        lastLogin: new Date(Date.now() - randInt(1, 30) * 86400000),
        createdAt: new Date(Date.now() - randInt(30, 180) * 86400000),
      };
    });
    const users = await User.insertMany(usersData, { timestamps: false });
    console.log(`   ✅ ${users.length} customers created\n`);

    // ── 4. Provider user accounts ─────────────────────────────────────────
    console.log('🧑‍🔧 Seeding provider accounts...');
    const providerPw = await bcrypt.hash('provider1234', 10);
    const providerUsers = await User.insertMany(
      PROVIDER_NAMES.map((name, i) => {
        const c = city();
        return {
          name,
          email: `provider.${name.toLowerCase().replace(/\s+/g, '')}${i + 1}@example.com`,
          phone: phone(),
          password: providerPw,
          role: 'provider',
          isActive: true,
          isBlocked: false,
          isPhoneVerified: true,
          isProfileComplete: true,
          location: { town: c, district: c, state: STATES[c] },
          lastLogin: new Date(Date.now() - randInt(1, 15) * 86400000),
          createdAt: new Date(Date.now() - randInt(30, 120) * 86400000),
        };
      }),
      { timestamps: false }
    );
    console.log(`   ✅ ${providerUsers.length} provider accounts created`);

    // ── 5. Provider profiles ──────────────────────────────────────────────
    console.log('   Building provider profiles...');
    const providerProfiles = await Provider.insertMany(
      providerUsers.map((u, i) => {
        const cat = categories[i % categories.length];
        const c   = u.location?.town || rand(CITIES);
        const isVerified = i < 10;           // first 10 verified, 5 pending
        return {
          userId: u._id,
          businessName: PROVIDER_NAMES[i],
          phone: u.phone,
          category: cat._id,
          pricing: {
            basePrice: randInt(300, 600),
            priceUnit: rand(['per_hour', 'per_job', 'negotiable']),
            description: `${cat.name} standard services`
          },
          rating: { average: randN(3.5, 5.0), count: randInt(5, 120) },
          location: { 
            town: c, 
            district: c, 
            state: STATES[c], 
            pincode: String(randInt(110000, 700000)),
            coordinates: { type: 'Point', coordinates: [77.2 + Math.random(), 28.5 + Math.random()] } 
          },
          isVerified,
          availability: {
            isAvailable: Math.random() > 0.3
          },
          stats: {
            totalEarnings: randInt(5000, 80000),
            completedJobs: randInt(10, 200),
            totalJobs: randInt(15, 220),
            cancelledJobs: randInt(0, 10),
          },
          bio: `Experienced ${cat.name.toLowerCase()} with ${randInt(2, 15)} years of experience in ${c} and surrounding areas.`,
          createdAt: new Date(Date.now() - randInt(30, 120) * 86400000),
        };
      }),
      { timestamps: false }
    );
    console.log(`   ✅ ${providerProfiles.length} provider profiles created\n`);

    // ── 5b. Seeding Services for Providers ──────────────────────────────────
    console.log('⚙️ Seeding provider services...');
    const servicesToInsert = [];
    for (const prov of providerProfiles) {
      const cat = categories.find(c => c._id.equals(prov.category));
      servicesToInsert.push({
        provider: prov._id,
        category: prov.category,
        title: `${cat.name} Standard Service`,
        description: `Standard professional ${cat.name.toLowerCase()} service.`,
        price: prov.pricing.basePrice,
        priceType: 'fixed',
        duration: 60,
        isActive: true
      });
      servicesToInsert.push({
        provider: prov._id,
        category: prov.category,
        title: `${cat.name} Premium Service`,
        description: `Premium high-quality ${cat.name.toLowerCase()} service.`,
        price: Math.round(prov.pricing.basePrice * 1.5),
        priceType: 'fixed',
        duration: 120,
        isActive: true
      });
    }
    const services = await Service.insertMany(servicesToInsert);
    console.log(`   ✅ ${services.length} services created\n`);

    // ── 6. Bookings ───────────────────────────────────────────────────────
    console.log('📅 Seeding bookings...');
    const bookingsData = Array.from({ length: 30 }, (_, i) => {
      const user     = rand(users);
      const prov     = rand(providerProfiles);
      const status   = rand(BOOKING_STATUSES);
      const provServices = services.filter(s => s.provider.equals(prov._id));
      const svc      = rand(provServices);
      const days     = randInt(1, 60);
      const date     = new Date(Date.now() - days * 86400000);
      const amount   = svc?.price || randInt(400, 2000);
      const c        = user.location?.town || rand(CITIES);
      const commission = Math.round(amount * 0.1);
      const providerEarning = amount - commission;

      return {
        bookingId: `BK2026${String(10000 + i + 1)}`,
        customer: user._id,
        provider: prov._id,
        category: prov.category,
        service: svc._id,
        status,
        scheduledAt: date,
        address: { 
          fullAddress: `${randInt(1, 200)} Main Road, ${c}, ${STATES[c]} - ${randInt(110000, 700000)}`,
          coordinates: { type: 'Point', coordinates: [77.2 + Math.random(), 28.5 + Math.random()] } 
        },
        notes: i % 3 === 0 ? 'Please call before arriving.' : '',
        price: amount,
        commission,
        providerEarning,
        paymentMethod: rand(PAYMENT_METHODS),
        paymentStatus: status === 'completed' ? 'paid' : rand(['pending', 'paid', 'failed']),
        createdAt: new Date(date.getTime() - randInt(1, 5) * 3600000),
      };
    });
    const bookings = await Booking.insertMany(bookingsData, { timestamps: false });
    console.log(`   ✅ ${bookings.length} bookings created\n`);

    // ── 7. Payments (for COMPLETED bookings) ──────────────────────────────
    console.log('💳 Seeding payments...');
    const completedBookings = bookings.filter(b => b.status === 'completed').slice(0, 10);
    const paymentsData = completedBookings.map((b) => ({
      booking: b._id,
      payer: b.customer,
      payee: b.provider,
      amount: b.price,
      commission: b.commission,
      providerAmount: b.providerEarning,
      method: b.paymentMethod,
      gateway: b.paymentMethod === 'cash' ? 'manual' : 'razorpay',
      razorpayPaymentId: b.paymentMethod === 'cash' ? undefined : `pay_${randInt(100000, 999999)}`,
      status: 'captured',
      createdAt: b.scheduledAt,
    }));
    const payments = await Payment.insertMany(paymentsData, { timestamps: false });
    console.log(`   ✅ ${payments.length} payments created\n`);

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════');
    console.log('🎉  SEED COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`   Categories : ${categories.length}`);
    console.log(`   Customers  : ${users.length}`);
    console.log(`   Providers  : ${providerProfiles.length} (10 verified, 5 pending)`);
    console.log(`   Services   : ${services.length}`);
    console.log(`   Bookings   : ${bookings.length}`);
    console.log(`   Payments   : ${payments.length}`);
    console.log('───────────────────────────────────────');
    console.log('   Admin login:    admin@localserve.com / admin123');
    console.log('   Customer login: ravi.kumar1@example.com / user1234');
    console.log('   Provider login: provider.mukeshelectricals1@example.com / provider1234');
    console.log('═══════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected. Bye! 👋');
    process.exit(0);
  }
};

seed();
