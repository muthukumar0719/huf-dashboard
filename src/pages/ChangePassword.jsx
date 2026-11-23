import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function ChangePassword({ forced, setTitle }) {
  const { setUser, logout } = useAuth();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setTitle?.('Change Password'), [setTitle]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (f.newPassword !== f.confirm) return setMsg({ type: 'error', text: 'New passwords do not match.' });
    setBusy(true);
    try {
      const r = await api('/api/auth/change-password', { method: 'POST', body: f });
      setF({ currentPassword: '', newPassword: '', confirm: '' });
      setMsg({ type: 'success', text: 'Password changed.' });
      setUser(r.user);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const form = (
    <form className={forced ? 'login-card' : 'card narrow'} onSubmit={submit}>
      {forced && (
        <>
          <img src="/aionion-logo.png" alt="Aionion Capital" className="login-logo" />
          <h2>Set a new password</h2>
          <p className="muted">You must change your password before continuing.</p>
        </>
      )}
      <label className="field">
        <span>Current password</span>
        <input type="password" value={f.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" required />
      </label>
      <label className="field">
        <span>New password</span>
        <input type="password" value={f.newPassword} onChange={set('newPassword')} autoComplete="new-password" required />
        <small className="muted">8+ characters with upper case, lower case, a number and a symbol.</small>
      </label>
      <label className="field">
        <span>Confirm new password</span>
        <input type="password" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" required />
      </label>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <button className="btn primary block" disabled={busy}>
        {busy ? 'Saving…' : 'Change password'}
      </button>
      {forced && (
        <button type="button" className="btn ghost block" onClick={logout}>
          Logout
        </button>
      )}
    </form>
  );
  return forced ? <div className="login-page">{form}</div> : form;
}
