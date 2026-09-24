import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getFareEstimates, calculateSurgeMultiplier } from '@/lib/fareEngine';

// POST /api/fare-estimate
export async function POST(request) {
  try {
    const { distance, vehicleType } = await request.json();

    if (!distance || distance <= 0) {
      return NextResponse.json({ error: 'Valid distance is required' }, { status: 400 });
    }

    const db = getDb();
    const activeRides = db.prepare("SELECT COUNT(*) as count FROM rides WHERE status IN ('pending', 'accepted', 'in_progress')").get().count;
    const availableDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE is_available = 1").get().count;
    const surgeMultiplier = calculateSurgeMultiplier(activeRides, availableDrivers);

    const estimates = getFareEstimates(distance, surgeMultiplier);

    return NextResponse.json({
      estimates,
      surgeMultiplier,
      surgeActive: surgeMultiplier > 1,
    });
  } catch (error) {
    console.error('Fare estimate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
