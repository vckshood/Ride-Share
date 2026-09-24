'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import BookRide from './BookRide';
import MyRides from './MyRides';
import AdminPanel from './AdminPanel';
import DriverPanel from './DriverPanel';

export default function Dashboard() {
  const { user, logout, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const navItems = user?.role === 'admin' ? [
    { id: 'overview', icon: '📊', label: 'Dashboard' },
    { id: 'rides', icon: '🚗', label: 'All Rides' },
    { id: 'drivers', icon: '👥', label: 'Drivers' },
    { id: 'admin', icon: '⚙️', label: 'Admin Panel' },
  ] : user?.role === 'driver' ? [
    { id: 'overview', icon: '📊', label: 'Dashboard' },
    { id: 'rides', icon: '🚗', label: 'My Rides' },
    { id: 'driver-panel', icon: '🛞', label: 'Driver Panel' },
  ] : [
    { id: 'overview', icon: '📊', label: 'Dashboard' },
    { id: 'book', icon: '🗺️', label: 'Book a Ride' },
    { id: 'rides', icon: '🚗', label: 'My Rides' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'book':
        return <BookRide onBooked={() => { fetchStats(); setActiveTab('rides'); showToast('Ride booked successfully!', 'success'); }} />;
      case 'rides':
        return <MyRides />;
      case 'admin':
        return <AdminPanel />;
      case 'driver-panel':
        return <DriverPanel />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading dashboard...</p>
        </div>
      );
    }

    if (user?.role === 'admin') {
      return (
        <>
          <div className="stats-grid">
            <div className="stat-card purple animate-fade-in-up" style={{ animationDelay: '0ms' }}>
              <div className="stat-icon purple">🚗</div>
              <div className="stat-value">{stats?.totalRides || 0}</div>
              <div className="stat-label">Total Rides</div>
              <div className="stat-change up">↑ 12%</div>
            </div>
            <div className="stat-card teal animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <div className="stat-icon teal">💰</div>
              <div className="stat-value">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-change up">↑ 8%</div>
            </div>
            <div className="stat-card green animate-fade-in-up" style={{ animationDelay: '160ms' }}>
              <div className="stat-icon green">👥</div>
              <div className="stat-value">{stats?.totalUsers || 0}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card orange animate-fade-in-up" style={{ animationDelay: '240ms' }}>
              <div className="stat-icon orange">🛞</div>
              <div className="stat-value">{stats?.activeDrivers || 0}/{stats?.totalDrivers || 0}</div>
              <div className="stat-label">Active Drivers</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent Rides</h3>
                  <p className="card-subtitle">{stats?.pendingRides || 0} pending</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('rides')}>View All</button>
              </div>
              {stats?.recentRides?.length > 0 ? (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Rider</th>
                        <th>Route</th>
                        <th>Fare</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentRides.slice(0, 5).map(ride => (
                        <tr key={ride.id}>
                          <td style={{ fontWeight: 500 }}>{ride.rider_name}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {ride.pickup_address?.split(',')[0]} → {ride.dropoff_address?.split(',')[0]}
                          </td>
                          <td style={{ fontWeight: 600 }}>₹{ride.fare}</td>
                          <td><span className={`badge badge-${ride.status.replace('_', '-')}`}>{ride.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <p className="empty-state-text">No rides yet</p>
                </div>
              )}
            </div>

            <div className="card animate-fade-in-up" style={{ animationDelay: '380ms' }}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">Top Drivers</h3>
                  <p className="card-subtitle">By rating & rides</p>
                </div>
              </div>
              {stats?.topDrivers?.map((driver, i) => (
                <div key={driver.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 0', borderBottom: i < stats.topDrivers.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}>
                  <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                    {driver.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{driver.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {driver.vehicle_model} · {driver.vehicle_number}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)' }}>
                      ⭐ {driver.rating}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {driver.total_rides} rides
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stats?.ridesByType?.length > 0 && (
            <div className="card animate-fade-in-up" style={{ marginTop: '20px', animationDelay: '450ms' }}>
              <div className="card-header">
                <h3 className="card-title">Revenue by Vehicle Type</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {stats.ridesByType.map(item => (
                  <div key={item.vehicle_type} style={{
                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                    padding: '16px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>
                      {item.vehicle_type === 'bike' ? '🏍️' : item.vehicle_type === 'auto' ? '🛺' : item.vehicle_type === 'premium' ? '✨' : '🚗'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', marginBottom: 4 }}>{item.vehicle_type}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>₹{(item.revenue || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.count} rides</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }

    if (user?.role === 'driver') {
      return (
        <>
          <div className="stats-grid">
            <div className="stat-card green animate-fade-in-up">
              <div className="stat-icon green">💰</div>
              <div className="stat-value">₹{(stats?.todayEarnings || 0).toLocaleString()}</div>
              <div className="stat-label">Today&apos;s Earnings</div>
            </div>
            <div className="stat-card purple animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <div className="stat-icon purple">🚗</div>
              <div className="stat-value">{stats?.todayRides || 0}</div>
              <div className="stat-label">Today&apos;s Rides</div>
            </div>
            <div className="stat-card teal animate-fade-in-up" style={{ animationDelay: '160ms' }}>
              <div className="stat-icon teal">⭐</div>
              <div className="stat-value">{stats?.rating || '5.0'}</div>
              <div className="stat-label">Your Rating</div>
            </div>
            <div className="stat-card orange animate-fade-in-up" style={{ animationDelay: '240ms' }}>
              <div className="stat-icon orange">📊</div>
              <div className="stat-value">{stats?.totalRides || 0}</div>
              <div className="stat-label">Total Rides</div>
            </div>
          </div>

          <div className="card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="card-header">
              <h3 className="card-title">Lifetime Earnings</h3>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--success)' }}>
              ₹{(stats?.totalEarnings || 0).toLocaleString()}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Across {stats?.totalRides || 0} completed rides
            </p>
          </div>
        </>
      );
    }

    // Rider overview
    return (
      <>
        <div className="stats-grid">
          <div className="stat-card purple animate-fade-in-up">
            <div className="stat-icon purple">🚗</div>
            <div className="stat-value">{stats?.totalRides || 0}</div>
            <div className="stat-label">Total Rides</div>
          </div>
          <div className="stat-card teal animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <div className="stat-icon teal">💳</div>
            <div className="stat-value">₹{(stats?.totalSpent || 0).toLocaleString()}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>

        {stats?.activeRide && (
          <div className="card animate-fade-in-up" style={{ animationDelay: '160ms', borderColor: 'var(--accent-primary)' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ color: 'var(--accent-primary)' }}>🔴 Active Ride</h3>
              <span className={`badge badge-${stats.activeRide.status.replace('_', '-')}`}>{stats.activeRide.status}</span>
            </div>
            <div className="ride-route">
              <div className="ride-route-dots">
                <div className="ride-route-dot pickup"></div>
                <div className="ride-route-line"></div>
                <div className="ride-route-dot dropoff"></div>
              </div>
              <div className="ride-route-info">
                <div className="ride-route-label">Pickup</div>
                <div className="ride-route-address">{stats.activeRide.pickup_address}</div>
                <div className="ride-route-label">Dropoff</div>
                <div className="ride-route-address">{stats.activeRide.dropoff_address}</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>₹{stats.activeRide.fare}</div>
          </div>
        )}

        <div className="card animate-fade-in-up" style={{ animationDelay: '240ms', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ready to ride?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
            Book a ride in seconds. Choose from bikes, autos, cars, and premium vehicles.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setActiveTab('book')}>
            🚗 Book a Ride
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🚗</div>
            <span className="sidebar-logo-text">RideShare</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={logout} title="Click to logout">
            <div className="user-avatar">{user?.name?.charAt(0) || '?'}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <span style={{ fontSize: 16 }}>🚪</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="page-header">
          <div>
            <button className="btn btn-ghost btn-icon"
              style={{ display: 'none' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >☰</button>
            <h1 className="page-title">
              {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="page-title-sub">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {user?.role === 'rider' && (
              <button className="btn btn-primary" onClick={() => setActiveTab('book')}>
                + Book Ride
              </button>
            )}
          </div>
        </header>

        <div className="page-body">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
