import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { api, fmtDateTime } from '../api.js';
import { Badge } from '../components.jsx';
import { useAuth } from '../App.jsx';

const ROLES = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', VIEWER: 'Viewer' };
const NEW = { username: '', fullName: '', email: '', role: 'ADMIN', password: '' };

export default function UserManagement({ setTitle }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [f, setF] = useState(NEW);
  const [msg, setMsg] = useState(null);
  const load = () => api('/api/users').then((r) => setUsers(r.users)).catch((e) => setMsg({ type: 'error', text: e.message }));
  useEffect(() => {
    setTitle('User Management');
    load();
  }, [setTitle]);

  const create = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/api/users', { method: 'POST', body: f });
      setMsg({ type: 'success', text: `User ${f.username} created.` });
      setF(NEW);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };
  const patch = async (u, body, okText) => {
    setMsg(null);
    try {
      await api(`/api/users/${u.id}`, { method: 'PATCH', body });
      if (okText) setMsg({ type: 'success', text: okText });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };
  const resetPassword = (u) => {
    const pw = window.prompt(`New temporary password for ${u.username} (8+ chars, upper, lower, number, symbol):`);
    if (pw) patch(u, { password: pw }, `Password reset for ${u.username}.`);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <form className="card filters" onSubmit={create}>
        <input placeholder="Username" value={f.username} onChange={set('username')} required autoComplete="off" />
        <input placeholder="Full name" value={f.fullName} onChange={set('fullName')} required />
        <input placeholder="Email (optional)" type="email" value={f.email} onChange={set('email')} />
        <select value={f.role} onChange={set('role')}>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input placeholder="Password" type="password" value={f.password} onChange={set('password')} required autoComplete="new-password" />
        <button className="btn primary"><UserPlus size={15} /> Add user</button>
      </form>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th /></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.fullName}</td>
                  <td>{u.email || 'N/A'}</td>
                  <td>
                    <select value={u.role} disabled={u.id === me.id} onChange={(e) => patch(u, { role: e.target.value })}>
                      {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td><Badge value={u.isActive ? 'ACTIVE' : 'BLOCKED'} text={u.isActive ? 'Active' : 'Disabled'} /></td>
                  <td>{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : 'Never'}</td>
                  <td className="actions">
                    <button className="btn small" onClick={() => resetPassword(u)}>Reset password</button>
                    {u.id !== me.id && (
                      <button className="btn small" onClick={() => patch(u, { isActive: !u.isActive })}>{u.isActive ? 'Disable' : 'Enable'}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
