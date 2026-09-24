'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const VEHICLE_TYPES = [
  { id: 'bike', icon: '🏍️', name: 'Bike', desc: 'Quick & affordable', seats: 1 },
  { id: 'auto', icon: '🛺', name: 'Auto', desc: 'Comfortable 3-wheeler', seats: 3 },
  { id: 'car', icon: '🚗', name: 'Car', desc: 'AC sedan', seats: 4 },
  { id: 'premium', icon: '✨', name: 'Premium', desc: 'Luxury experience', seats: 6 },
];

const SAMPLE_LOCATIONS = [
  { name: 'Koregaon Park, Pune', lat: 18.5362, lng: 73.8935 },
  { name: 'Hinjewadi IT Park, Pune', lat: 18.5912, lng: 73.7390 },
  { name: 'Shivaji Nagar, Pune', lat: 18.5308, lng: 73.8475 },
  { name: 'Pune Airport', lat: 18.5822, lng: 73.9197 },
  { name: 'Deccan Gymkhana, Pune', lat: 18.5168, lng: 73.8410 },
  { name: 'Viman Nagar, Pune', lat: 18.5679, lng: 73.9143 },
  { name: 'Magarpatta City, Pune', lat: 18.5133, lng: 73.9268 },
  { name: 'Baner, Pune', lat: 18.5590, lng: 73.7868 },
  { name: 'Wakad, Pune', lat: 18.5942, lng: 73.7640 },
  { name: 'Kothrud, Pune', lat: 18.5074, lng: 73.8077 },
];

export default function BookRide({ onBooked }) {
  const { authFetch } = useAuth();
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fareEstimates, setFareEstimates] = useState(null);
  const [surgeInfo, setSurgeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [distance, setDistance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);

  const searchLocations = (query) => {
    if (!query) return [];
    return SAMPLE_LOCATIONS.filter(loc =>
      loc.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const calculateDistance = (pickup, dropoff) => {
    const p = SAMPLE_LOCATIONS.find(l => l.name === pickup);
    const d = SAMPLE_LOCATIONS.find(l => l.name === dropoff);
    if (!p || !d) return Math.random() * 15 + 3;
    const R = 6371;
    const dLat = (d.lat - p.lat) * Math.PI / 180;
    const dLng = (d.lng - p.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p.lat * Math.PI / 180) * Math.cos(d.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  };

  const handleGetEstimates = async () => {
    if (!pickup || !dropoff) return;
    if (pickup === dropoff) return;
    setLoading(true);
    try {
      const dist = calculateDistance(pickup, dropoff);
      setDistance(dist);
      const res = await authFetch('/api/fare-estimate', {
        method: 'POST',
        body: JSON.stringify({ distance: dist }),
      });
      const data = await res.json();
      if (res.ok) {
        setFareEstimates(data.estimates);
        setSurgeInfo(data.surgeActive ? data.surgeMultiplier : null);
        setStep(2);
      }
    } catch (err) {
      console.error('Failed to get estimates');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async () => {
    if (!selectedVehicle) return;
    setBooking(true);
    try {
      const pickupLoc = SAMPLE_LOCATIONS.find(l => l.name === pickup);
      const dropoffLoc = SAMPLE_LOCATIONS.find(l => l.name === dropoff);
      const res = await authFetch('/api/rides', {
        method: 'POST',
        body: JSON.stringify({
          vehicleType: selectedVehicle,
          pickupAddress: pickup,
          dropoffAddress: dropoff,
          pickupLat: pickupLoc?.lat || 18.52,
          pickupLng: pickupLoc?.lng || 73.85,
          dropoffLat: dropoffLoc?.lat || 18.53,
          dropoffLng: dropoffLoc?.lng || 73.86,
          distance,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookingResult(data);
        setStep(3);
      }
    } catch (err) {
      console.error('Failed to book ride');
    } finally {
      setBooking(false);
    }
  };

  if (step === 3 && bookingResult) {
    return (
      <div className="animate-fade-in-up" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px', borderColor: 'var(--success)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Ride Booked!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{bookingResult.message}</p>

          {bookingResult.driver && (
            <div className="driver-info-card" style={{ justifyContent: 'center', maxWidth: 400, margin: '0 auto 24px' }}>
              <div className="driver-info-avatar">{bookingResult.driver.name?.charAt(0)}</div>
              <div className="driver-info-details">
                <div className="driver-info-name">{bookingResult.driver.name}</div>
                <div className="driver-info-vehicle">
                  {bookingResult.driver.vehicleModel} · {bookingResult.driver.vehicleNumber}
                </div>
              </div>
              <div className="driver-info-rating">⭐ {bookingResult.driver.rating}</div>
            </div>
          )}

          <div className="ride-route" style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto 24px' }}>
            <div className="ride-route-dots">
              <div className="ride-route-dot pickup"></div>
              <div className="ride-route-line"></div>
              <div className="ride-route-dot dropoff"></div>
            </div>
            <div className="ride-route-info">
              <div className="ride-route-label">Pickup</div>
              <div className="ride-route-address">{pickup}</div>
              <div className="ride-route-label">Dropoff</div>
              <div className="ride-route-address">{dropoff}</div>
            </div>
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 24 }}>
            ₹{bookingResult.ride?.fare}
          </div>

          <button className="btn btn-primary btn-lg" onClick={onBooked}>
            View My Rides
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-section">
      {/* Map placeholder */}
      <div className="booking-map animate-fade-in">
        <div className="booking-map-placeholder">
          <span>🗺️</span>
          <p style={{ fontSize: 14 }}>
            {pickup && dropoff ? (
              <>{pickup.split(',')[0]} → {dropoff.split(',')[0]}<br />
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-primary)' }}>{distance} km</span></>
            ) : 'Select pickup & dropoff locations'}
          </p>
          {pickup && dropoff && (
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(0,184,148,0.1)', padding: '8px 16px',
                borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ color: 'var(--success)', fontSize: 16 }}>●</span>
                <span style={{ fontSize: 12 }}>{pickup.split(',')[0]}</span>
              </div>
              <div style={{
                background: 'rgba(255,107,107,0.1)', padding: '8px 16px',
                borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ color: 'var(--danger)', fontSize: 16 }}>●</span>
                <span style={{ fontSize: 12 }}>{dropoff.split(',')[0]}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Panel */}
      <div className="booking-panel animate-slide-in">
        {step === 1 && (
          <>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 20 }}>📍 Where to?</h3>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">
                  <span style={{ color: 'var(--success)' }}>●</span> Pickup Location
                </label>
                <input
                  className="form-input"
                  placeholder="Search pickup location..."
                  value={pickup}
                  onChange={e => { setPickup(e.target.value); setPickupSuggestions(searchLocations(e.target.value)); }}
                  onFocus={() => setPickupSuggestions(searchLocations(pickup || 'Pune'))}
                  onBlur={() => setTimeout(() => setPickupSuggestions([]), 200)}
                />
                {pickupSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', marginTop: 4, maxHeight: 200, overflowY: 'auto'
                  }}>
                    {pickupSuggestions.map(loc => (
                      <div key={loc.name}
                        style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border-color)' }}
                        onMouseDown={() => { setPickup(loc.name); setPickupSuggestions([]); }}
                      >📍 {loc.name}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">
                  <span style={{ color: 'var(--danger)' }}>●</span> Dropoff Location
                </label>
                <input
                  className="form-input"
                  placeholder="Search dropoff location..."
                  value={dropoff}
                  onChange={e => { setDropoff(e.target.value); setDropoffSuggestions(searchLocations(e.target.value)); }}
                  onFocus={() => setDropoffSuggestions(searchLocations(dropoff || 'Pune'))}
                  onBlur={() => setTimeout(() => setDropoffSuggestions([]), 200)}
                />
                {dropoffSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', marginTop: 4, maxHeight: 200, overflowY: 'auto'
                  }}>
                    {dropoffSuggestions.map(loc => (
                      <div key={loc.name}
                        style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border-color)' }}
                        onMouseDown={() => { setDropoff(loc.name); setDropoffSuggestions([]); }}
                      >📍 {loc.name}</div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={handleGetEstimates}
                disabled={!pickup || !dropoff || pickup === dropoff || loading}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Getting estimates...</>
                ) : 'Get Fare Estimates'}
              </button>
            </div>
          </>
        )}

        {step === 2 && fareEstimates && (
          <>
            {surgeInfo && (
              <div className="surge-banner">
                <span>⚡</span>
                <span>Surge pricing {surgeInfo}x active due to high demand</span>
              </div>
            )}

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Choose your ride</h3>
              <div className="vehicle-grid">
                {fareEstimates.map(est => {
                  const vType = VEHICLE_TYPES.find(v => v.id === est.vehicleType);
                  return (
                    <div
                      key={est.vehicleType}
                      className={`vehicle-option ${selectedVehicle === est.vehicleType ? 'selected' : ''}`}
                      onClick={() => setSelectedVehicle(est.vehicleType)}
                    >
                      <div className="vehicle-option-icon">{vType?.icon}</div>
                      <div className="vehicle-option-name">{vType?.name}</div>
                      <div className="vehicle-option-price">₹{est.totalFare}</div>
                      <div className="vehicle-option-detail">{est.estimatedDuration} min · {est.distanceKm} km</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedVehicle && (
              <div className="fare-summary animate-fade-in-up">
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Fare Breakdown</h4>
                {(() => {
                  const est = fareEstimates.find(e => e.vehicleType === selectedVehicle);
                  return (
                    <>
                      <div className="fare-row">
                        <span>Base Fare</span><span>₹{est.baseFare}</span>
                      </div>
                      <div className="fare-row">
                        <span>Distance ({est.distanceKm} km × ₹{est.perKmRate})</span>
                        <span>₹{(est.distanceKm * est.perKmRate).toFixed(0)}</span>
                      </div>
                      {est.surgeMultiplier > 1 && (
                        <div className="fare-row" style={{ color: 'var(--warning)' }}>
                          <span>⚡ Surge ({est.surgeMultiplier}x)</span>
                          <span>Applied</span>
                        </div>
                      )}
                      <div className="fare-row total">
                        <span>Total</span>
                        <span className="fare-amount">₹{est.totalFare}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Payment Method</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                {['cash', 'card', 'wallet'].map(method => (
                  <button
                    key={method}
                    className={`btn ${paymentMethod === method ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ flex: 1, textTransform: 'capitalize' }}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method === 'cash' ? '💵' : method === 'card' ? '💳' : '👛'} {method}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={handleBookRide}
                disabled={!selectedVehicle || booking}
              >
                {booking ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Booking...</>
                ) : `Book ${VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.name || 'Ride'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
