import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import Breadcrumb from './Breadcrumb';
import ActiveCallPanel from './ActiveCallPanel';
import CallLogForm from './CallLogForm';
import UndisposedCallsBadge from './UndisposedCallsBadge';

const NAV_ITEMS = [
  { to: '/candidates', label: 'Candidates' },
  { to: '/clients', label: 'Clients' },
  { to: '/job-requirements', label: 'Job Requirements' },
  { to: '/applications', label: 'Applications' },
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin/employees', label: 'Employees' },
  { to: '/admin/transfer', label: 'Transfer' },
  { to: '/admin/compliance', label: 'Follow-up Compliance' },
  { to: '/admin/call-logs', label: 'Call Logs' },
];

const ADMIN_CMS_ITEMS = [
  { to: '/admin/cms/funnel-stages', label: 'Funnel Stages' },
  { to: '/admin/cms/call-dispositions', label: 'Call Dispositions' },
  { to: '/admin/cms/lead-sources', label: 'Lead Sources' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const homePath = user?.role === 'super_admin' ? '/admin' : '/app';

  function navLinkClass({ isActive }) {
    return isActive ? 'nav-active' : '';
  }

  return (
    <div className="dashboard-shell">
      {drawerOpen && <div className="sidebar-scrim" onClick={() => setDrawerOpen(false)} />}

      <aside className={`dashboard-sidebar ${drawerOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          Oak<span>Hire</span>
        </div>
        <nav className="sidebar-nav" onClick={() => setDrawerOpen(false)}>
          <NavLink to={homePath} end className={navLinkClass}>
            Dashboard
          </NavLink>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'super_admin' && (
            <>
              <div className="sidebar-section-label">Admin</div>
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
              <div className="sidebar-section-label">CMS</div>
              {ADMIN_CMS_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button
              type="button"
              className="btn-secondary icon-button sidebar-toggle"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={drawerOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div>
              <Breadcrumb />
              <span className="dashboard-user">
                {user?.name} · {user?.role === 'super_admin' ? 'Super Admin' : 'Employee'}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <UndisposedCallsBadge />
            <ThemeToggle />
            <NotificationBell />
            <button type="button" className="btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>

      <ActiveCallPanel />
      <CallLogForm />
    </div>
  );
}
