import { useEffect, useRef, useState } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, X } from 'lucide-react';
import { api, qs, fmtDateTime } from '../api.js';
import { Badge, Pager, Empty, na } from '../components.jsx';
import { useAuth } from '../App.jsx';

export default function Upload({ setTitle }) {
  const { user } = useAuth();
  const canUpload = user.role !== 'VIEWER';
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState({ status: '', search: '', page: 1 });
  const [reload, setReload] = useState(0);
  const input = useRef(null);

  useEffect(() => setTitle('Upload'), [setTitle]);
  useEffect(() => {
    const t = setTimeout(() => api(`/api/boid?${qs(filter)}`).then(setList).catch((e) => setError(e.message)), 250);
    return () => clearTimeout(t);
  }, [filter, reload]);

  const pick = (f) => {
    setResult(null);
    setError('');
    if (f && !/\.(xlsx|csv)$/i.test(f.name)) return setError('Choose a .xlsx or .csv file.');
    setFile(f || null);
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      setResult(await api('/api/boid/upload', { method: 'POST', form }));
      setFile(null);
      if (input.current) input.current.value = '';
      setReload((n) => n + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (row, status) => {
    try {
      await api(`/api/boid/${row.id}`, { method: 'PATCH', body: { status } });
      setReload((n) => n + 1);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <div className="tabs"><button className="active">BOID</button></div>

      {canUpload && (
        <div className="card upload-card">
          <div className="upload-head">
            <span className="upload-icon"><UploadIcon size={18} /></span>
            <div>
              <b>BOID Upload</b>
              <div className="muted small">Add new BOIDs to stock from an Excel or CSV file</div>
            </div>
          </div>
          <div
            className={`dropzone ${drag ? 'drag' : ''}`}
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files[0]);
            }}
          >
            {file ? (
              <span className="file-chip" onClick={(e) => e.stopPropagation()}>
                <FileSpreadsheet size={16} /> {file.name} ({Math.ceil(file.size / 1024)} KB)
                <button className="icon-btn" onClick={() => pick(null)} aria-label="Remove file"><X size={14} /></button>
              </span>
            ) : (
              <>
                <UploadIcon size={22} className="accent" />
                <div><span className="accent">Click to choose</span> or drag a file here</div>
                <small className="muted">.xlsx or .csv, up to 20,000 rows</small>
              </>
            )}
            <input ref={input} type="file" accept=".xlsx,.csv" hidden onChange={(e) => pick(e.target.files[0])} />
          </div>
          <ul className="hints">
            <li>One BOID per row, in a column headed <b>BOID</b> (or the first column).</li>
            <li>Each BOID must be exactly 16 digits. Format the column as <b>Text</b> in Excel.</li>
            <li>Valid new BOIDs are added as <b>AVAILABLE</b> stock; duplicates are skipped.</li>
          </ul>
          {error && <div className="alert error">{error}</div>}
          {result && (
            <div className="alert success">
              <b>{result.inserted}</b> BOIDs added from {result.totalRows} rows.
              {result.alreadyInStock > 0 && <> {result.alreadyInStock} already in stock.</>}
              {result.duplicatesInFile > 0 && <> {result.duplicatesInFile} repeated in the file.</>}
              {result.invalid > 0 && <> {result.invalid} invalid.</>}
              {result.invalidRows?.length > 0 && (
                <details>
                  <summary>Invalid rows</summary>
                  <ul>
                    {result.invalidRows.map((r) => (
                      <li key={r.row}>Row {r.row}: "{r.value}" ({r.reason})</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          <div className="right">
            <button className="btn primary" disabled={!file || busy} onClick={submit}>
              {busy ? 'Uploading…' : 'Upload BOIDs'}
            </button>
          </div>
        </div>
      )}

      <h3 className="section-title">BOID stock</h3>
      <div className="card filters">
        <input className="grow" placeholder="Search BOID or client code" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value, page: 1 })} />
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value, page: 1 })}>
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="USED">Used</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>
      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>BOID</th>
                <th>Status</th>
                <th>Client Code</th>
                <th>Allotted At</th>
                <th>Source File</th>
                <th>Uploaded By</th>
                <th>Uploaded At</th>
                {user.role === 'SUPER_ADMIN' && <th />}
              </tr>
            </thead>
            <tbody>
              {list?.rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.boid}</td>
                  <td><Badge value={r.status} /></td>
                  <td>{na(r.client_code)}</td>
                  <td>{r.allotted_at ? fmtDateTime(r.allotted_at) : 'N/A'}</td>
                  <td>{na(r.source_file_name)}</td>
                  <td>{na(r.uploaded_by)}</td>
                  <td>{fmtDateTime(r.uploaded_at)}</td>
                  {user.role === 'SUPER_ADMIN' && (
                    <td>
                      {r.status === 'AVAILABLE' && <button className="btn small" onClick={() => setStatus(r, 'BLOCKED')}>Block</button>}
                      {r.status === 'BLOCKED' && <button className="btn small" onClick={() => setStatus(r, 'AVAILABLE')}>Unblock</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {list && !list.rows.length && <Empty>No BOIDs yet.</Empty>}
        </div>
        {list && <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={(p) => setFilter({ ...filter, page: p })} />}
      </div>
    </>
  );
}
