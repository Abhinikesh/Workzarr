# Workzarr

> Home services, on demand. A local services marketplace connecting customers with verified, background-checked service providers — electricians, plumbers, cleaners, painters & more.

🔗 **Live Demo:** [https://workzarr-bj4p.vercel.app/](https://workzarr-bj4p.vercel.app/)

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Made with](https://img.shields.io/badge/made%20with-React%20%7C%20Node.js%20%7C%20MongoDB-orange)

---

## 📖 Overview

Workzarr is a full-stack home services marketplace built for the Indian market, inspired by platforms like Urban Company. It connects **customers** who need home services with **verified service providers** in their city — offering instant booking, secure payments, and transparent reviews.

The platform has three independent applications:

| App | Description | Tech |
|---|---|---|
| **User App** | Customer-facing app to search, book & track services | React + Vite |
| **Provider Portal** | Onboarding & dashboard for service professionals | React + Vite |
| **Admin Panel** | Internal dashboard to manage users, providers, bookings & payments | React + Vite + Redux |
| **Backend API** | REST API powering all three apps | Node.js + Express |

---

## ✨ Features

- 🔐 **Secure Authentication** — Email/password login + Google OAuth for both customers and providers
- 📍 **Location-Based Discovery** — Browse verified specialists active in your city
- ⚡ **Instant Booking** — Book a service in under 2 minutes
- 💳 **Secure Payments** — Pay only after the service is completed
- ⭐ **Verified Reviews** — Transparent ratings from real customers
- 🛠️ **Provider Dashboard** — Manage bookings, earnings, and availability
- 🧑‍💼 **Admin Control Center** — Manage users, providers, categories, bookings & analytics
- 🔔 **Real-Time Updates** — Live booking status via Socket.io
- 📦 **Background Jobs** — Automated provider ranking & subscription checks via Agenda.js

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Redux Toolkit + Redux Persist
- Tailwind CSS
- Axios

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Redis (caching, rate limiting)
- JWT Authentication + Passport.js (Google OAuth)
- Socket.io (real-time updates)
- Agenda.js (background job scheduling)

**Deployment**
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas
- Cache → Redis Cloud

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)

### 1. Clone the repository

```bash
git clone https://github.com/Abhinikesh/Workzarr.git
cd Workzarr
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `/backend`:

```env
PORT=8000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
REDIS_URI=your_redis_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Seed the database (first time only):

```bash
node scripts/seed.js
```

Start the backend:

```bash
npm run dev
```

The API runs on `http://localhost:8000`.

### 3. Set up the customer/provider frontend

```bash
cd ..
npm install
npm run dev
```

Runs on `http://localhost:3000`.

### 4. Set up the admin panel

```bash
cd admin
npm install
npm run dev
```

Runs on `http://localhost:3001`.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@localserve.com | admin123 |
| Customer | customer@test.com | test123 |
| Provider | provider@test.com | test123 |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/Abhinikesh/Workzarr/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Abhinikesh**
GitHub: [@Abhinikesh](https://github.com/Abhinikesh)

---

<p align="center">Made with ❤️ in India</p>
