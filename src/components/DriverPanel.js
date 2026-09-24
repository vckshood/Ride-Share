'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DriverPanel() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ridesRes] = await Promise.all([
        authFetch('/api/stats'),
        authFetch('/api/rides'),
      ]);
      const statsData = await statsRes.json();
      const ridesData = await ridesRes.json();
      if (statsRes.ok) setStats(statsData);
      if (ridesRes.ok) setRides(ridesData.rides || []);
    } catch (err) {
      console.error('Failed to fetch driver data');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (rideId, action) => {
    try {
      const res = await authFetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Action failed');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading driver panel...</p>
      </div>
    );
  }

  const activeRides = rides.filter(r => ['accepted', 'in_progress'].includes(r.status));
  const completedRides = rides.filter(r => r.status === 'completed');

  return (
    <div>
      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card green">
          <div className="stat-icon green">🟢</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {stats?.driver?.is_available ? 'Online' : 'Offline'}
          </div>
          <div className="stat-label">Current Status</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple">🚗</div>
          <div className="stat-value">{activeRides.length}</div>
          <div className="stat-label">Active Rides</div>
        </div>
      </div>

      {/* Active Rides */}
      {activeRides.length > 0 && (
        <div className="card animate-fade-in-up" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">🔴 Active Rides</h3>
          </div>
          {activeRides.map(ride => (
            <div key={ride.id} style={{
              padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
              marginBottom: 12, border: '1px solid var(--border-active)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className={`badge badge-${ride.status.replace('_', '-')}`}>{ride.status.replace('_', ' ')}</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₹{ride.fare}</span>
              </div>
              <div className="ride-route">
                <div className="ride-route-dots">
                  <div className="ride-route-dot pickup"></div>
                  <div className="ride-route-line"></div>
                  <div className="ride-route-dot dropoff"></div>
                </div>
                <div className="ride-route-info">
                  <div className="ride-route-label">Pickup</div>
                  <div className="ride-route-address">{ride.pickup_address}</div>
                  <div className="ride-route-label">Dropoff</div>
                  <div className="ride-route-address">{ride.dropoff_address}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {ride.status === 'accepted' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleAction(ride.id, 'start')}>
                    ▶️ Start Ride
                  </button>
                )}
                {ride.status === 'in_progress' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleAction(ride.id, 'complete')}>
                    ✓ Complete Ride
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Rides */}
      <div className="card animate-fade-in-up">
        <div className="card-header">
          <h3 className="card-title">Completed Rides</h3>
          <p className="card-subtitle">{completedRides.length} rides</p>
        </div>
        {completedRides.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Route</th>
                  <th>Distance</th>
                  <th>Fare</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {completedRides.map(ride => (
                  <tr key={ride.id}>
                    <td style={{ fontWeight: 500 }}>{ride.rider_name || 'Rider'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {ride.pickup_address?.split(',')[0]} → {ride.dropoff_address?.split(',')[0]}
                    </td>
                    <td>{ride.distance} km</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{ride.fare}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {ride.completed_at ? new Date(ride.completed_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <p className="empty-state-text">No completed rides yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
