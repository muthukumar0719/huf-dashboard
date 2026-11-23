import { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await api('/api/auth/login', { method: 'POST', body: { username, password } });
      onLogin(r.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <img src="/aionion-logo.png" alt="Aionion Capital" className="login-logo" />
        <h2>HUF Dashboard</h2>
        <p className="muted">Sign in to manage HUF onboarding</p>
        <label className="field">
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
        </label>
        <label className="field">
          <span>Password</span>
          <div className="input-icon">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {error && <div className="alert error">{error}</div>}
        <button className="btn primary block" disabled={busy}>
          <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
