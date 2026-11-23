import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Users, AlertTriangle, CreditCard, Upload as UploadIcon, UserCog, Sun, Moon, LogOut, KeyRound, Menu, X,
} from 'lucide-react';
import { api, setUnauthorizedHandler } from './api.js';
import Login from './pages/Login.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import ClientDetails from './pages/ClientDetails.jsx';
import NeedAttention from './pages/NeedAttention.jsx';
import Payments from './pages/Payments.jsx';
import Upload from './pages/Upload.jsx';
import UserManagement from './pages/UserManagement.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const ROLE_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', VIEWER: 'Viewer' };

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('huf-dash-theme') || 'light';
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('huf-dash-theme', theme);
    } catch {}
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))];
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking session
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    api('/api/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    navigate('/login');
  };

  if (user === undefined) return <div className="center-screen muted">Loading…</div>;

  return (
    <AuthCtx.Provider value={{ user, setUser, logout }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={setUser} />} />
        <Route
          path="/*"
          element={!user ? <Navigate to="/login" replace /> : <Shell />}
        />
      </Routes>
    </AuthCtx.Provider>
  );
}

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/need-attention', label: 'Need Attention', icon: AlertTriangle },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/upload', label: 'Upload', icon: UploadIcon },
  { to: '/users', label: 'User Management', icon: UserCog, role: 'SUPER_ADMIN' },
];

function Shell() {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [title, setTitle] = useState('');

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src="/aionion-logo.png" alt="Aionion Capital" />
          <button className="icon-btn only-mobile" onClick={() => setNavOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="module-chip">HUF · ONBOARDING</div>
        <nav>
          {NAV.filter((n) => !n.role || n.role === user.role).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setNavOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="backdrop" onClick={() => setNavOpen(false)} />
      <main className="main">
        <header className="topbar">
          <button className="icon-btn only-mobile" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <h1>{title}</h1>
          <div className="topbar-actions">
            <button className="pill-btn" onClick={toggleTheme}>
              {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
              <span className="hide-sm">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <span className="muted hide-sm" title={user.username}>
              {user.fullName} · {ROLE_LABEL[user.role]}
            </span>
            <NavLink to="/change-password" className="btn">
              <KeyRound size={16} className="only-mobile-inline" />
              <span className="hide-sm">Change password</span>
            </NavLink>
            <button className="btn" onClick={logout}>
              <LogOut size={16} className="only-mobile-inline" />
              <span className="hide-sm">Logout</span>
            </button>
          </div>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard setTitle={setTitle} />} />
            <Route path="/clients" element={<Clients setTitle={setTitle} />} />
            <Route path="/clients/:id" element={<ClientDetails setTitle={setTitle} />} />
            <Route path="/need-attention" element={<NeedAttention setTitle={setTitle} />} />
            <Route path="/payments" element={<Payments setTitle={setTitle} />} />
            <Route path="/upload" element={<Upload setTitle={setTitle} />} />
            <Route path="/change-password" element={<ChangePassword setTitle={setTitle} />} />
            {user.role === 'SUPER_ADMIN' && <Route path="/users" element={<UserManagement setTitle={setTitle} />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
