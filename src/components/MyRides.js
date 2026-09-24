'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function MyRides() {
  const { authFetch } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [ratingModal, setRatingModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/rides?status=${filter}` : '/api/rides';
      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok) setRides(data.rides || []);
    } catch (err) {
      console.error('Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  }, [authFetch, filter]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handleAction = async (rideId, action, extra = {}) => {
    try {
      const res = await authFetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) fetchRides();
    } catch (err) {
      console.error('Action failed');
    }
  };

  const handleRate = async () => {
    if (!ratingModal) return;
    await handleAction(ratingModal, 'rate', { rating, comment: ratingComment });
    setRatingModal(null);
    setRating(5);
    setRatingComment('');
  };

  const statusFilters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {statusFilters.map(f => (
          <button
            key={f.value}
            className={`btn ${filter === f.value ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading rides...</p>
        </div>
      ) : rides.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚗</div>
          <h3 className="empty-state-title">No rides found</h3>
          <p className="empty-state-text">
            {filter ? `No ${filter.replace('_', ' ')} rides` : 'You haven\'t taken any rides yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rides.map((ride, i) => (
            <div key={ride.id} className="ride-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="ride-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge badge-${ride.vehicle_type}`}>
                    {ride.vehicle_type === 'bike' ? '🏍️' : ride.vehicle_type === 'auto' ? '🛺' : ride.vehicle_type === 'premium' ? '✨' : '🚗'}
                    {' '}{ride.vehicle_type}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDate(ride.created_at)}
                  </span>
                </div>
                <span className={`badge badge-${ride.status.replace('_', '-')}`}>
                  {ride.status.replace('_', ' ')}
                </span>
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

              <div className="ride-meta">
                <div className="ride-meta-item">
                  <span>📏</span> {ride.distance} km
                </div>
                <div className="ride-meta-item">
                  <span>⏱️</span> {ride.duration_minutes} min
                </div>
                <div className="ride-meta-item" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                  <span>💰</span> ₹{ride.fare}
                </div>
                {ride.surge_multiplier > 1 && (
                  <div className="ride-meta-item" style={{ color: 'var(--warning)' }}>
                    <span>⚡</span> {ride.surge_multiplier}x surge
                  </div>
                )}
                {ride.driver_name && (
                  <div className="ride-meta-item">
                    <span>👤</span> {ride.driver_name}
                  </div>
                )}
                {ride.vehicle_number && (
                  <div className="ride-meta-item">
                    <span>🔢</span> {ride.vehicle_number}
                  </div>
                )}
              </div>

              {/* Actions */}
              {(ride.status === 'pending' || ride.status === 'accepted') && (
                <div className="ride-actions">
                  {ride.status === 'accepted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleAction(ride.id, 'start')}>
                      ▶️ Start Ride
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleAction(ride.id, 'cancel')}>
                    ✕ Cancel
                  </button>
                </div>
              )}

              {ride.status === 'in_progress' && (
                <div className="ride-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleAction(ride.id, 'complete')}>
                    ✓ Complete Ride
                  </button>
                </div>
              )}

              {ride.status === 'completed' && (
                <div className="ride-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setRatingModal(ride.id)}>
                    ⭐ Rate Ride
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="modal-overlay" onClick={() => setRatingModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Rate your ride</h3>
              <button className="modal-close" onClick={() => setRatingModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="stars" style={{ justifyContent: 'center', marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <span
                    key={s}
                    className={`star ${s <= rating ? 'filled' : ''}`}
                    onClick={() => setRating(s)}
                  >★</span>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="How was your ride?"
                  value={ratingComment}
                  onChange={e => setRatingComment(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRatingModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRate}>Submit Rating</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
