import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { calculateFare, estimateDuration, getFareEstimates, calculateSurgeMultiplier } from '@/lib/fareEngine';
import { v4 as uuidv4 } from 'uuid';

// GET /api/rides - get rides for current user
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query;
    let params;

    if (user.role === 'admin') {
      query = `
        SELECT r.*, u.name as rider_name, u.phone as rider_phone,
               d.vehicle_number, d.vehicle_model, du.name as driver_name
        FROM rides r
        JOIN users u ON r.rider_id = u.id
        LEFT JOIN drivers d ON r.driver_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        ${status ? 'WHERE r.status = ?' : ''}
        ORDER BY r.created_at DESC LIMIT ? OFFSET ?
      `;
      params = status ? [status, limit, offset] : [limit, offset];
    } else if (user.role === 'driver') {
      const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(user.id);
      if (!driver) {
        return NextResponse.json({ rides: [], total: 0 });
      }
      query = `
        SELECT r.*, u.name as rider_name, u.phone as rider_phone
        FROM rides r
        JOIN users u ON r.rider_id = u.id
        WHERE r.driver_id = ?
        ${status ? 'AND r.status = ?' : ''}
        ORDER BY r.created_at DESC LIMIT ? OFFSET ?
      `;
      params = status ? [driver.id, status, limit, offset] : [driver.id, limit, offset];
    } else {
      query = `
        SELECT r.*, d.vehicle_number, d.vehicle_model, du.name as driver_name, du.phone as driver_phone
        FROM rides r
        LEFT JOIN drivers d ON r.driver_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        WHERE r.rider_id = ?
        ${status ? 'AND r.status = ?' : ''}
        ORDER BY r.created_at DESC LIMIT ? OFFSET ?
      `;
      params = status ? [user.id, status, limit, offset] : [user.id, limit, offset];
    }

    const rides = db.prepare(query).all(...params);

    // Count total
    let countQuery;
    if (user.role === 'admin') {
      countQuery = db.prepare(`SELECT COUNT(*) as total FROM rides ${status ? 'WHERE status = ?' : ''}`);
    } else if (user.role === 'driver') {
      const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(user.id);
      countQuery = db.prepare(`SELECT COUNT(*) as total FROM rides WHERE driver_id = ? ${status ? 'AND status = ?' : ''}`);
      const total = status ? countQuery.get(driver?.id, status) : countQuery.get(driver?.id);
      return NextResponse.json({ rides, total: total?.total || 0 });
    } else {
      countQuery = db.prepare(`SELECT COUNT(*) as total FROM rides WHERE rider_id = ? ${status ? 'AND status = ?' : ''}`);
      const total = status ? countQuery.get(user.id, status) : countQuery.get(user.id);
      return NextResponse.json({ rides, total: total?.total || 0 });
    }

    const total = status ? countQuery.get(status) : countQuery.get();
    return NextResponse.json({ rides, total: total?.total || 0 });
  } catch (error) {
    console.error('Get rides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rides - book a new ride
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vehicleType, pickupAddress, dropoffAddress, pickupLat, pickupLng, dropoffLat, dropoffLng, distance, paymentMethod } = body;

    if (!vehicleType || !pickupAddress || !dropoffAddress || !distance) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['bike', 'auto', 'car', 'premium'].includes(vehicleType)) {
      return NextResponse.json({ error: 'Invalid vehicle type' }, { status: 400 });
    }

    if (distance <= 0) {
      return NextResponse.json({ error: 'Distance must be greater than 0' }, { status: 400 });
    }

    const db = getDb();

    // Calculate surge
    const activeRides = db.prepare("SELECT COUNT(*) as count FROM rides WHERE status IN ('pending', 'accepted', 'in_progress')").get().count;
    const availableDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE is_available = 1 AND vehicle_type = ?").get(vehicleType).count;
    const surgeMultiplier = calculateSurgeMultiplier(activeRides, availableDrivers);

    const durationMinutes = estimateDuration(distance, vehicleType);
    const fare = calculateFare(vehicleType, distance, durationMinutes, surgeMultiplier);

    // Find nearest available driver
    const nearestDriver = db.prepare(`
      SELECT d.*, u.name as driver_name FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.is_available = 1 AND d.vehicle_type = ?
      ORDER BY ABS(d.current_lat - ?) + ABS(d.current_lng - ?) ASC
      LIMIT 1
    `).get(vehicleType, pickupLat || 18.52, pickupLng || 73.85);

    const rideId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO rides (id, rider_id, driver_id, vehicle_type, pickup_address, dropoff_address,
        pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, distance, duration_minutes,
        fare, surge_multiplier, status, payment_method, created_at${nearestDriver ? ', accepted_at' : ''})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?${nearestDriver ? ', ?' : ''})
    `).run(
      rideId, user.id, nearestDriver?.id || null, vehicleType,
      pickupAddress, dropoffAddress,
      pickupLat || 18.52, pickupLng || 73.85,
      dropoffLat || 18.53, dropoffLng || 73.86,
      distance, durationMinutes, fare, surgeMultiplier,
      nearestDriver ? 'accepted' : 'pending',
      paymentMethod || 'cash',
      now,
      ...(nearestDriver ? [now] : [])
    );

    // Mark driver as unavailable
    if (nearestDriver) {
      db.prepare('UPDATE drivers SET is_available = 0 WHERE id = ?').run(nearestDriver.id);
    }

    const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(rideId);

    return NextResponse.json({
      ride,
      driver: nearestDriver ? { name: nearestDriver.driver_name, vehicleNumber: nearestDriver.vehicle_number, vehicleModel: nearestDriver.vehicle_model, rating: nearestDriver.rating } : null,
      message: nearestDriver ? 'Ride accepted! Driver is on the way.' : 'Looking for a driver...',
    }, { status: 201 });
  } catch (error) {
    console.error('Book ride error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
