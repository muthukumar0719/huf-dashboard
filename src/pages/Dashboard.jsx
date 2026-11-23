import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, label } from '../api.js';
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
  const max = Math.max(1, ...d.byStage.map((s) => s.count));
  const low = d.boid.available < d.boidAlertBelow;

  return (
    <>
      <div className="stat-grid">
        <StatCard title="Total Applications" value={d.apps.total} sub={`${d.apps.today} today`} onClick={() => navigate('/clients')} />
        <StatCard title="Completed (eSigned)" value={d.apps.completed} tone="green" onClick={() => navigate('/clients?status=ESIGNED')} />
        <StatCard title="Awaiting eSign" value={d.apps.awaiting_esign} tone="amber" onClick={() => navigate('/need-attention')} />
        <StatCard title="In Progress" value={d.apps.in_progress} onClick={() => navigate('/clients?status=IN_PROGRESS')} />
      </div>

      <h3 className="section-title">BOID</h3>
      <div className="stat-grid three">
        <StatCard title="Total Accounts" value={d.boid.total} />
        <StatCard title="Used" value={d.boid.used} tone="red" />
        <StatCard title="Available" value={d.boid.available} tone="green" />
      </div>
      {low && (
        <div className="alert warn">
          Only {d.boid.available} BOIDs are available (alert below {d.boidAlertBelow}).{' '}
          <a onClick={() => navigate('/upload')} className="link">Upload more</a>
        </div>
      )}

      <h3 className="section-title">Applications by stage</h3>
      <div className="card">
        <p className="muted small">Last completed step of each application.</p>
        <div className="bars">
          {d.byStage.map((s) => (
            <button key={s.stage} className="bar-row" onClick={() => navigate(`/clients?stage=${s.stage}`)}>
              <span className="bar-label">{label(s.stage)}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${(s.count / max) * 100}%` }} />
              </span>
              <span className="bar-value">{s.count}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
