import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/drivers
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const available = searchParams.get('available');
    const vehicleType = searchParams.get('vehicleType');

    let query = `
      SELECT d.*, u.name, u.email, u.phone
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (available === 'true') {
      query += ' AND d.is_available = 1';
    }
    if (vehicleType) {
      query += ' AND d.vehicle_type = ?';
      params.push(vehicleType);
    }

    query += ' ORDER BY d.rating DESC';
    const drivers = db.prepare(query).all(...params);

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
