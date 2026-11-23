import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { StatCard } from '../components.jsx';

export default function Dashboard({ setTitle }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    setTitle('Dashboard');
    api('/api/dashboard/stats').then(setD).catch((e) => setError(e.message));
  }, [setTitle]);

  if (error) return <div className="alert error">{error}</div>;
  if (!d) return <div className="muted">Loading…</div>;

  return (
    <>
      <div className="stat-grid">
        <StatCard title="Total Applications" value={d.apps.total} sub={`${d.apps.today} today`} onClick={() => navigate('/clients')} />
        <StatCard title="Completed (eSigned)" value={d.apps.completed} tone="green" onClick={() => navigate('/clients?status=ESIGNED')} />
        <StatCard title="Awaiting eSign" value={d.apps.awaiting_esign} tone="amber" onClick={() => navigate('/clients?status=IN_PROGRESS')} />
        <StatCard title="In Progress" value={d.apps.in_progress} onClick={() => navigate('/clients?status=IN_PROGRESS')} />
      </div>

      <h3 className="section-title">BOID</h3>
      <div className="stat-grid three">
        <StatCard title="Total Accounts" value={d.boid.total} />
        <StatCard title="Used" value={d.boid.used} tone="red" />
        <StatCard title="Available" value={d.boid.available} tone="green" />
      </div>
    </>
  );
}
