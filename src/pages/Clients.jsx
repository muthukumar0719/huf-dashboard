import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Download } from 'lucide-react';
import { api, qs, download, fmtDate, label } from '../api.js';
import { Badge, CopyBtn, Pager, Empty, na } from '../components.jsx';

const STAGES = ['CONTACT_PAN', 'BANK_DETAILS', 'KARTA_COPARCENERS', 'HUF_DOCUMENTS', 'MOBILE_OTP', 'EMAIL_OTP', 'CONSENT', 'PAYMENT', 'LIVE_PHOTO', 'ESIGN'];

const COLUMNS = [
  { key: 'created_at', label: 'Application Date', render: (r) => fmtDate(r.created_at) },
  { key: 'unique_id', label: 'Unique ID' },
  { key: 'client_code', label: 'Client Code', copy: true },
  { key: 'client_name', label: 'Client Name' },
  { key: 'huf_pan_number', label: 'HUF PAN', copy: true },
  { key: 'karta_pan_number', label: 'Karta PAN', copy: true, hidden: true },
  { key: 'email', label: 'Email ID' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'huf_stage', label: 'Stage', render: (r) => label(r.huf_stage) },
  { key: 'huf_status', label: 'Status', render: (r) => <Badge value={r.huf_status} text={r.huf_status === 'ESIGNED' ? 'Completed' : 'In Progress'} /> },
  { key: 'payment_state', label: 'Payment', render: (r) => <Badge value={r.payment_state} /> },
  { key: 'rm_name', label: 'RM Name' },
  { key: 'rm_branch', label: 'RM Branch', hidden: true },
];

function loadCols() {
  try {
    const v = JSON.parse(localStorage.getItem('huf-dash-cols'));
    if (Array.isArray(v)) return v;
  } catch {}
  return COLUMNS.filter((c) => !c.hidden).map((c) => c.key);
}

export default function Clients({ setTitle }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ rows: [], total: 0, page: 1, pageSize: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(loadCols);
  const [colsOpen, setColsOpen] = useState(false);
  const [search, setSearch] = useState(params.get('search') || '');
  const colsRef = useRef(null);

  const filters = {
    search: params.get('search') || '',
    stage: params.get('stage') || '',
    status: params.get('status') || '',
    payment: params.get('payment') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    page: params.get('page') || '1',
  };
  const setFilter = (k, v) => {
    const next = { ...filters, [k]: v, page: k === 'page' ? v : '1' };
    setParams(qs(next));
  };

  useEffect(() => setTitle('Clients'), [setTitle]);
  useEffect(() => {
    setLoading(true);
    api(`/api/clients?${qs(filters)}`)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Debounced search box.
  useEffect(() => {
    if (search === filters.search) return;
    const t = setTimeout(() => setFilter('search', search), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem('huf-dash-cols', JSON.stringify(visible));
    } catch {}
  }, [visible]);
  useEffect(() => {
    const close = (e) => colsRef.current && !colsRef.current.contains(e.target) && setColsOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const cols = COLUMNS.filter((c) => visible.includes(c.key));
  const { page, ...exportFilters } = filters;

  return (
    <>
      <div className="card filters">
        <input className="grow" placeholder="Search code, PAN, email, mobile, name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ESIGNED">Completed</option>
        </select>
        <select value={filters.stage} onChange={(e) => setFilter('stage', e.target.value)}>
          <option value="">All Stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <select value={filters.payment} onChange={(e) => setFilter('payment', e.target.value)}>
          <option value="">All Payments</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} aria-label="From date" />
        <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} aria-label="To date" />
        <div className="dropdown" ref={colsRef}>
          <button className="btn" onClick={() => setColsOpen((o) => !o)}>
            Columns ({cols.length}/{COLUMNS.length}) <ChevronDown size={14} />
          </button>
          {colsOpen && (
            <div className="dropdown-menu">
              {COLUMNS.map((c) => (
                <label key={c.key} className="check">
                  <input
                    type="checkbox"
                    checked={visible.includes(c.key)}
                    onChange={(e) => setVisible(e.target.checked ? [...visible, c.key] : visible.filter((k) => k !== c.key))}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
        <button className="btn primary" onClick={() => download(`/api/clients/export?${qs(exportFilters)}`, 'huf-clients.csv').catch((e) => setError(e.message))}>
          Export <Download size={14} />
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      <div className={`card table-card ${loading ? 'loading' : ''}`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => navigate(`/clients/${r.id}`)}>
                  {cols.map((c) => (
                    <td key={c.key}>
                      {c.render ? c.render(r) : na(r[c.key])}
                      {c.copy && <CopyBtn value={r[c.key]} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !data.rows.length && <Empty>No applications match these filters.</Empty>}
        </div>
        <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={(p) => setFilter('page', String(p))} />
      </div>
    </>
  );
}
