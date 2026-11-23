import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { api, qs, download, fmtDateTime, fmtMoney } from '../api.js';
import { Badge, StatCard, Pager, Empty, na } from '../components.jsx';

const EMPTY = { name: '', mobile: '', txn: '', status: '', from: '', to: '' };

export default function Payments({ setTitle }) {
  const navigate = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => setTitle('Payments'), [setTitle]);
  // Text boxes apply after a short pause; selects and dates apply at once.
  useEffect(() => {
    const t = setTimeout(() => {
      setApplied(f);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [f]);
  useEffect(() => {
    api(`/api/payments?${qs({ ...applied, page })}`)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [applied, page]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const s = data?.summary;

  return (
    <>
      <div className="stat-grid">
        <StatCard title="Total Transactions" value={s?.total} sub={fmtMoney(s?.total_amount)} active={!f.status} onClick={() => setF({ ...f, status: '' })} />
        <StatCard title="Successful" value={s?.success} sub={fmtMoney(s?.success_amount)} tone="green" active={f.status === 'SUCCESS'} onClick={() => setF({ ...f, status: 'SUCCESS' })} />
        <StatCard title="Pending" value={s?.pending} sub={fmtMoney(s?.pending_amount)} tone="amber" active={f.status === 'PENDING'} onClick={() => setF({ ...f, status: 'PENDING' })} />
        <StatCard title="Failed" value={s?.failed} sub={fmtMoney(s?.failed_amount)} tone="red" active={f.status === 'FAILED'} onClick={() => setF({ ...f, status: 'FAILED' })} />
      </div>

      <div className="card filters">
        <input placeholder="Client Name" value={f.name} onChange={set('name')} />
        <input placeholder="Mobile Number" value={f.mobile} onChange={set('mobile')} inputMode="numeric" />
        <input placeholder="Order / Payment ID" value={f.txn} onChange={set('txn')} />
        <select value={f.status} onChange={set('status')}>
          <option value="">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <input type="date" value={f.from} onChange={set('from')} aria-label="From date" />
        <input type="date" value={f.to} onChange={set('to')} aria-label="To date" />
        <button className="btn primary" onClick={() => download(`/api/payments/export?${qs(applied)}`, 'huf-payments.csv').catch((e) => setError(e.message))}>
          Export Report <Download size={14} />
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Mobile Number</th>
                <th>Transaction ID</th>
                <th>Payment ID</th>
                <th>Method</th>
                <th className="num">Amount</th>
                <th>Payment Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => navigate(`/clients/${r.id}`)} title={r.payment_error_description || ''}>
                  <td>{na(r.client_name)}</td>
                  <td>{na(r.mobile)}</td>
                  <td className="mono">{na(r.order_id)}</td>
                  <td className="mono">{na(r.payment_id)}</td>
                  <td>{na(r.payment_method)}</td>
                  <td className="num"><b>{fmtMoney(r.amount)}</b></td>
                  <td>{fmtDateTime(r.payment_date)}</td>
                  <td><Badge value={r.state} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.rows.length && <Empty>No payments match these filters.</Empty>}
        </div>
        {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </div>
    </>
  );
}
