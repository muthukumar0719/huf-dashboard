import { useEffect, useRef, useState } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, X } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function Upload({ setTitle }) {
  const { user } = useAuth();
  const canUpload = user.role !== 'VIEWER';
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const input = useRef(null);

  useEffect(() => setTitle('Upload'), [setTitle]);

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
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
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
      {!canUpload && <div className="card muted">Only Admins can upload BOIDs.</div>}
    </>
  );
}
