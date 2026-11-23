import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtDateTime, label } from '../api.js';
import { Badge, Empty, na } from '../components.jsx';

const REASONS = {
  PAYMENT_FAILED: 'Payment failed',
  PAID_NOT_ESIGNED: 'Paid over 1 day ago, not eSigned',
  BANK_NOT_VERIFIED: 'Bank account not verified',
  NO_ACTIVITY_3_DAYS: 'No activity for 3+ days',
};

export default function NeedAttention({ setTitle }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setTitle('Need Attention');
    api('/api/dashboard/need-attention').then((r) => setRows(r.rows)).catch((e) => setError(e.message));
  }, [setTitle]);

  const counts = Object.fromEntries(Object.keys(REASONS).map((k) => [k, rows?.filter((r) => r.reason === k).length || 0]));
  const shown = rows?.filter((r) => !reason || r.reason === reason) || [];

  return (
    <>
      <div className="tabs">
        <button className={!reason ? 'active' : ''} onClick={() => setReason('')}>All ({rows?.length || 0})</button>
        {Object.entries(REASONS).map(([k, v]) => (
          <button key={k} className={reason === k ? 'active' : ''} onClick={() => setReason(k)}>
            {v} ({counts[k]})
          </button>
        ))}
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unique ID</th>
                <th>Client Name</th>
                <th>HUF PAN</th>
                <th>Mobile</th>
                <th>Stage</th>
                <th>RM</th>
                <th>Reason</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => navigate(`/clients/${r.id}`)} title={r.payment_error_description || ''}>
                  <td>{r.unique_id}</td>
                  <td>{na(r.client_name)}</td>
                  <td>{na(r.huf_pan_number)}</td>
                  <td>{na(r.mobile)}</td>
                  <td>{label(r.huf_stage)}</td>
                  <td>{na(r.rm_name)}</td>
                  <td><Badge value={r.reason} text={REASONS[r.reason]} /></td>
                  <td>{fmtDateTime(r.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows && !shown.length && <Empty>Nothing needs attention.</Empty>}
        </div>
      </div>
    </>
  );
}
