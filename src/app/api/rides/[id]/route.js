import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// PATCH /api/rides/[id] - update ride status
export async function PATCH(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action, cancellationReason, rating, comment } = await request.json();

    const db = getDb();
    const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(id);

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    switch (action) {
      case 'start':
        if (ride.status !== 'accepted') {
          return NextResponse.json({ error: 'Ride must be accepted to start' }, { status: 400 });
        }
        db.prepare("UPDATE rides SET status = 'in_progress', started_at = ? WHERE id = ?").run(now, id);
        break;

      case 'complete':
        if (ride.status !== 'in_progress') {
          return NextResponse.json({ error: 'Ride must be in progress to complete' }, { status: 400 });
        }
        db.prepare("UPDATE rides SET status = 'completed', completed_at = ?, payment_status = 'paid' WHERE id = ?").run(now, id);

        // Update driver stats
        if (ride.driver_id) {
          db.prepare(`
            UPDATE drivers SET is_available = 1, total_rides = total_rides + 1,
            total_earnings = total_earnings + ? WHERE id = ?
          `).run(ride.fare, ride.driver_id);
        }
        break;

      case 'cancel':
        if (!['pending', 'accepted'].includes(ride.status)) {
          return NextResponse.json({ error: 'Ride cannot be cancelled' }, { status: 400 });
        }
        db.prepare("UPDATE rides SET status = 'cancelled', cancelled_at = ?, cancellation_reason = ? WHERE id = ?")
          .run(now, cancellationReason || 'User cancelled', id);

        if (ride.driver_id) {
          db.prepare('UPDATE drivers SET is_available = 1 WHERE id = ?').run(ride.driver_id);
        }
        break;

      case 'rate':
        if (ride.status !== 'completed') {
          return NextResponse.json({ error: 'Can only rate completed rides' }, { status: 400 });
        }
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        const { v4: uuidv4 } = require('uuid');
        const targetUserId = ride.driver_id
          ? db.prepare('SELECT user_id FROM drivers WHERE id = ?').get(ride.driver_id)?.user_id
          : null;

        if (targetUserId) {
          db.prepare('INSERT INTO ratings (id, ride_id, from_user_id, to_user_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)')
            .run(uuidv4(), id, user.id, targetUserId, rating, comment || null);

          // Update driver average rating
          const avgRating = db.prepare(`
            SELECT AVG(r.rating) as avg FROM ratings r
            JOIN drivers d ON d.user_id = r.to_user_id
            WHERE d.id = ?
          `).get(ride.driver_id);

          if (avgRating?.avg) {
            db.prepare('UPDATE drivers SET rating = ? WHERE id = ?').run(Math.round(avgRating.avg * 10) / 10, ride.driver_id);
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedRide = db.prepare('SELECT * FROM rides WHERE id = ?').get(id);
    return NextResponse.json({ ride: updatedRide });
  } catch (error) {
    console.error('Update ride error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/rides/[id] - get ride details
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const ride = db.prepare(`
      SELECT r.*, u.name as rider_name, u.phone as rider_phone,
             d.vehicle_number, d.vehicle_model, d.rating as driver_rating,
             du.name as driver_name, du.phone as driver_phone
      FROM rides r
      JOIN users u ON r.rider_id = u.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE r.id = ?
    `).get(id);

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    return NextResponse.json({ ride });
  } catch (error) {
    console.error('Get ride error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
