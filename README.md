# 🚗 RideShare Pro — Full-Stack Ride Sharing Platform

An advanced, full-stack ride-sharing web application built with **Next.js 16 (App Router)**, **SQLite (`better-sqlite3`)**, and **Vanilla CSS**. Features real-time fare calculations mirroring the core Java system rates, role-based dashboards (Rider, Driver, Admin), live booking simulation, and analytics.

---

## 🚀 Live Demo Credentials

Use any of the seeded accounts to log in:

| Role | Email | Password | Details |
|---|---|---|---|
| **Rider** | `vivek@rideshare.com` | `password123` | Book rides, view history, fare calculator |
| **Driver (Bike)** | `utkarsh@rideshare.com` | `password123` | Royal Enfield Classic 350 (`MH12AB1234`) |
| **Driver (Car)** | `jaya@rideshare.com` | `password123` | Maruti Suzuki Swift (`MH14XY5678`) |
| **Admin** | `admin@rideshare.com` | `admin123` | Platform analytics, all rides, driver status |

---

## 🛠️ Deploying to Render

This project is pre-configured for **Render Web Service** deployment with the included [`render.yaml`](render.yaml).

### Option 1: Automatic Blueprint (Recommended)
1. Push this repository to your **GitHub** or **GitLab** account.
2. Go to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Connect your repository — Render will automatically detect `render.yaml` and configure:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **Apply** to deploy!

### Option 2: Manual Web Service
1. In [Render Dashboard](https://dashboard.render.com), click **New +** > **Web Service**.
2. Connect your Git repository.
3. Set the following fields:
   - **Name**: `rideshare`
   - **Region**: Choose the closest to you (e.g., Singapore, Oregon, Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   - `NODE_VERSION` = `20.18.0`
   - `JWT_SECRET` = *(Generate a random secret string or click Generate)*
   - `NEXT_TELEMETRY_DISABLED` = `1`
5. Click **Create Web Service**.

---

## 💾 Database Persistence on Render

- **Free Tier**: SQLite runs on the local filesystem and automatically initializes and seeds demo data on every deploy/restart.
- **Paid Tier (Optional)**: If you attach a **Render Persistent Disk** (e.g. mounted at `/var/data`), set the environment variable:
  ```env
  DATABASE_PATH=/var/data/rideshare.db
  ```

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

---

## 📂 Project Structure

```text
rideshare/
├── render.yaml          # Render deployment blueprint
├── java/                # Original Java source & class files
│   ├── RideSharingSystem.java
│   ├── BikeRide.class
│   ├── CarRide.class
│   └── ...
├── src/
│   ├── app/
│   │   ├── api/         # Next.js API Routes (auth, rides, drivers, stats, fare)
│   │   ├── globals.css  # Modern UI Design System
│   │   └── page.js      # Auth & Main Entry
│   ├── components/      # UI components (BookRide, MyRides, DriverPanel, AdminPanel)
│   ├── context/         # AuthContext
│   └── lib/             # db.js (SQLite + Seed), fareEngine.js, auth.js
└── package.json
```
