'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminPanel() {
  const { authFetch } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await authFetch('/api/drivers');
      const data = await res.json();
      if (res.ok) setDrivers(data.drivers || []);
    } catch (err) {
      console.error('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading admin data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card animate-fade-in-up">
        <div className="card-header">
          <div>
            <h3 className="card-title">Driver Management</h3>
            <p className="card-subtitle">{drivers.length} registered drivers</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Number</th>
                <th>Rating</th>
                <th>Rides</th>
                <th>Earnings</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {driver.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{driver.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{driver.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${driver.vehicle_type}`} style={{ textTransform: 'capitalize' }}>
                      {driver.vehicle_type}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{driver.vehicle_model}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>{driver.vehicle_number}</td>
                  <td>
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>⭐ {driver.rating}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{driver.total_rides}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{(driver.total_earnings || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${driver.is_available ? 'badge-completed' : 'badge-cancelled'}`}>
                      {driver.is_available ? '🟢 Available' : '🔴 Busy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
