import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/stats - dashboard statistics
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    if (user.role === 'admin') {
      const totalRides = db.prepare('SELECT COUNT(*) as count FROM rides').get().count;
      const completedRides = db.prepare("SELECT COUNT(*) as count FROM rides WHERE status = 'completed'").get().count;
      const totalRevenue = db.prepare("SELECT COALESCE(SUM(fare), 0) as total FROM rides WHERE status = 'completed'").get().total;
      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      const totalDrivers = db.prepare('SELECT COUNT(*) as count FROM drivers').get().count;
      const activeDrivers = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE is_available = 1').get().count;
      const pendingRides = db.prepare("SELECT COUNT(*) as count FROM rides WHERE status = 'pending'").get().count;
      const activeRides = db.prepare("SELECT COUNT(*) as count FROM rides WHERE status IN ('accepted', 'in_progress')").get().count;

      // Rides by vehicle type
      const ridesByType = db.prepare(`
        SELECT vehicle_type, COUNT(*) as count, SUM(fare) as revenue
        FROM rides WHERE status = 'completed'
        GROUP BY vehicle_type
      `).all();

      // Recent rides
      const recentRides = db.prepare(`
        SELECT r.*, u.name as rider_name, du.name as driver_name
        FROM rides r
        JOIN users u ON r.rider_id = u.id
        LEFT JOIN drivers d ON r.driver_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        ORDER BY r.created_at DESC LIMIT 10
      `).all();

      // Top drivers
      const topDrivers = db.prepare(`
        SELECT d.*, u.name FROM drivers d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.rating DESC, d.total_rides DESC LIMIT 5
      `).all();

      return NextResponse.json({
        totalRides, completedRides, totalRevenue, totalUsers,
        totalDrivers, activeDrivers, pendingRides, activeRides,
        ridesByType, recentRides, topDrivers,
      });
    }

    if (user.role === 'driver') {
      const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(user.id);
      if (!driver) return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });

      const todayRides = db.prepare(`
        SELECT COUNT(*) as count FROM rides
        WHERE driver_id = ? AND status = 'completed' AND DATE(completed_at) = DATE('now')
      `).get(driver.id).count;

      const todayEarnings = db.prepare(`
        SELECT COALESCE(SUM(fare), 0) as total FROM rides
        WHERE driver_id = ? AND status = 'completed' AND DATE(completed_at) = DATE('now')
      `).get(driver.id).total;

      return NextResponse.json({
        driver, todayRides, todayEarnings,
        totalRides: driver.total_rides,
        totalEarnings: driver.total_earnings,
        rating: driver.rating,
      });
    }

    // Rider stats
    const totalRides = db.prepare("SELECT COUNT(*) as count FROM rides WHERE rider_id = ?").get(user.id).count;
    const totalSpent = db.prepare("SELECT COALESCE(SUM(fare), 0) as total FROM rides WHERE rider_id = ? AND status = 'completed'").get(user.id).total;
    const activeRide = db.prepare("SELECT * FROM rides WHERE rider_id = ? AND status IN ('pending', 'accepted', 'in_progress') LIMIT 1").get(user.id);

    return NextResponse.json({ totalRides, totalSpent, activeRide });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
