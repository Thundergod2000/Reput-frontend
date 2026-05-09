// src/components/DashboardLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const adminLinks = [
    { to: '/admin/businesses', label: 'Businesses', icon: '🏢' },
    { to: '/admin/employees',  label: 'All Employees', icon: '👥' },
    { to: '/admin/analytics',  label: 'Analytics', icon: '📊' },
  ];

  const bizLinks = [
    { to: '/dashboard/reviews', label: 'Private Reviews', icon: '📝' },
    { to: '/dashboard/team',    label: 'My Team', icon: '👥' },
  ];

  const links = isAdmin ? adminLinks : bizLinks;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, background: 'var(--bg-primary)',
        borderRight: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>ReviewLoop</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, paddingLeft: 18 }}>
            {isAdmin ? 'Admin panel' : 'Business dashboard'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
          {links.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--green-dark)' : 'var(--text-secondary)',
              background: isActive ? 'var(--green-light)' : 'transparent',
              marginBottom: 2, textDecoration: 'none', transition: 'all 0.15s',
            })}>
              <span>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>

        {/* User / logout */}
        <div style={{ padding: '1rem', borderTop: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft: 220, flex: 1, padding: '2rem', maxWidth: 1100 }}>
        <Outlet />
      </main>
    </div>
  );
}