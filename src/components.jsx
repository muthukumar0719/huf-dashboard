import { useState } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { label } from './api.js';

export function CopyBtn({ value }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <button
      className="copy-btn"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(String(value)).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
    >
      {done ? <Check size={12} /> : <Copy size={12} />} {done ? 'Copied' : 'Copy'}
    </button>
  );
}

const TONE = {
  SUCCESS: 'green', PAID: 'green', ESIGNED: 'green', ACTIVE: 'green', AVAILABLE: 'green',
  PENDING: 'amber', IN_PROGRESS: 'amber', USED: 'blue',
  FAILED: 'red', BLOCKED: 'red', PAYMENT_FAILED: 'red', BANK_NOT_VERIFIED: 'red',
  PAID_NOT_ESIGNED: 'amber', NO_ACTIVITY_3_DAYS: 'gray',
};
export const Badge = ({ value, text }) => <span className={`badge ${TONE[value] || 'gray'}`}>{text || label(value)}</span>;

export function StatCard({ title, value, sub, tone, active, onClick }) {
  return (
    <div className={`stat-card ${active ? 'active' : ''} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="stat-title">{title}</div>
      <div className={`stat-value ${tone || ''}`}>{value ?? '—'}</div>
      {sub && <div className={`stat-sub ${tone || ''}`}>{sub}</div>}
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pager">
      <span className="muted">
        {total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : 'No records'}
      </span>
      <button className="icon-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      <span>
        {page} / {pages}
      </span>
      <button className="icon-btn" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export const Empty = ({ children }) => <div className="empty muted">{children}</div>;
export const na = (v) => (v === null || v === undefined || v === '' ? 'N/A' : v);
