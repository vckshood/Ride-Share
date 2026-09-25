import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'rideshare.db');

let db;

export function getDb() {
  if (!db) {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const instance = new Database(DB_PATH);
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');
    initializeDatabase(instance);
    db = instance;
  }
  return db;
}

function initializeDatabase(targetDb) {
  targetDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'rider' CHECK(role IN ('rider', 'driver', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('bike', 'car', 'auto', 'premium')),
      vehicle_number TEXT NOT NULL,
      vehicle_model TEXT,
      license_number TEXT NOT NULL,
      is_available INTEGER DEFAULT 1,
      current_lat REAL DEFAULT 0,
      current_lng REAL DEFAULT 0,
      rating REAL DEFAULT 5.0,
      total_rides INTEGER DEFAULT 0,
      total_earnings REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY,
      rider_id TEXT NOT NULL REFERENCES users(id),
      driver_id TEXT REFERENCES drivers(id),
      vehicle_type TEXT NOT NULL,
      pickup_address TEXT NOT NULL,
      dropoff_address TEXT NOT NULL,
      pickup_lat REAL NOT NULL,
      pickup_lng REAL NOT NULL,
      dropoff_lat REAL NOT NULL,
      dropoff_lng REAL NOT NULL,
      distance REAL NOT NULL,
      duration_minutes INTEGER,
      fare REAL NOT NULL,
      surge_multiplier REAL DEFAULT 1.0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
      payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'card', 'wallet')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      cancelled_at DATETIME,
      cancellation_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL REFERENCES rides(id),
      from_user_id TEXT NOT NULL REFERENCES users(id),
      to_user_id TEXT NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK(type IN ('info', 'ride', 'payment', 'promo')),
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_id);
    CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
    CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
    CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);

  // Seed demo data if empty
  const userCount = targetDb.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedDemoData(targetDb);
  }
}

function seedDemoData(targetDb) {
  // Create demo users
  const demoUsers = [
    { id: uuidv4(), name: 'Vivek Sharma', email: 'vivek@rideshare.com', password: bcrypt.hashSync('password123', 10), phone: '+91-9876543210', role: 'rider' },
    { id: uuidv4(), name: 'Utkarsh Anand', email: 'utkarsh@rideshare.com', password: bcrypt.hashSync('password123', 10), phone: '+91-9876543211', role: 'driver' },
    { id: uuidv4(), name: 'Jaya Shankar', email: 'jaya@rideshare.com', password: bcrypt.hashSync('password123', 10), phone: '+91-9876543212', role: 'driver' },
    { id: uuidv4(), name: 'Priya Patel', email: 'priya@rideshare.com', password: bcrypt.hashSync('password123', 10), phone: '+91-9876543213', role: 'driver' },
    { id: uuidv4(), name: 'Admin User', email: 'admin@rideshare.com', password: bcrypt.hashSync('admin123', 10), phone: '+91-9000000000', role: 'admin' },
  ];

  const insertUser = targetDb.prepare(`
    INSERT INTO users (id, name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertDriver = targetDb.prepare(`
    INSERT INTO drivers (id, user_id, vehicle_type, vehicle_number, vehicle_model, license_number, current_lat, current_lng, rating, total_rides, total_earnings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRide = targetDb.prepare(`
    INSERT INTO rides (id, rider_id, driver_id, vehicle_type, pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, distance, duration_minutes, fare, status, payment_status, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = targetDb.transaction(() => {
    for (const u of demoUsers) {
      insertUser.run(u.id, u.name, u.email, u.password, u.phone, u.role);
    }

    // Create drivers for driver-role users
    const drivers = [
      { id: uuidv4(), user_id: demoUsers[1].id, vehicle_type: 'bike', vehicle_number: 'MH12AB1234', vehicle_model: 'Royal Enfield Classic 350', license_number: 'MH1220210012345', lat: 18.5204, lng: 73.8567, rating: 4.8, rides: 342, earnings: 85000 },
      { id: uuidv4(), user_id: demoUsers[2].id, vehicle_type: 'car', vehicle_number: 'MH14XY5678', vehicle_model: 'Maruti Suzuki Swift', license_number: 'MH1420200054321', lat: 18.5314, lng: 73.8446, rating: 4.6, rides: 512, earnings: 245000 },
      { id: uuidv4(), user_id: demoUsers[3].id, vehicle_type: 'premium', vehicle_number: 'MH01CC9999', vehicle_model: 'Toyota Innova Crysta', license_number: 'MH0120190099999', lat: 18.5074, lng: 73.8077, rating: 4.9, rides: 189, earnings: 320000 },
    ];

    for (const d of drivers) {
      insertDriver.run(d.id, d.user_id, d.vehicle_type, d.vehicle_number, d.vehicle_model, d.license_number, d.lat, d.lng, d.rating, d.rides, d.earnings);
    }

    // Create some completed rides
    const pastDates = [
      '2026-09-20 10:30:00', '2026-09-21 14:15:00', '2026-09-22 09:00:00',
      '2026-09-23 18:45:00', '2026-09-24 08:00:00',
    ];

    const rideData = [
      { pickup: 'Koregaon Park, Pune', dropoff: 'Hinjewadi IT Park', dist: 18.5, dur: 42, fare: 370, type: 'car' },
      { pickup: 'Shivaji Nagar, Pune', dropoff: 'Kothrud', dist: 7.2, dur: 22, fare: 72, type: 'bike' },
      { pickup: 'Viman Nagar, Pune', dropoff: 'Pune Airport', dist: 4.8, dur: 15, fare: 240, type: 'premium' },
      { pickup: 'Deccan Gymkhana', dropoff: 'Magarpatta City', dist: 12.3, dur: 35, fare: 246, type: 'car' },
      { pickup: 'Baner, Pune', dropoff: 'Wakad', dist: 5.1, dur: 18, fare: 51, type: 'bike' },
    ];

    for (let i = 0; i < rideData.length; i++) {
      const r = rideData[i];
      insertRide.run(
        uuidv4(), demoUsers[0].id, drivers[i % 3].id, r.type,
        r.pickup, r.dropoff, 18.52 + Math.random() * 0.05, 73.8 + Math.random() * 0.05,
        18.52 + Math.random() * 0.05, 73.8 + Math.random() * 0.05,
        r.dist, r.dur, r.fare, 'completed', 'paid', pastDates[i], pastDates[i]
      );
    }
  });

  transaction();
}
