import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, FileText, Pin } from 'lucide-react';
import { api, blobUrl, fmtDateTime, fmtMoney, label } from '../api.js';
import { Badge, CopyBtn, Empty } from '../components.jsx';
import { useAuth } from '../App.jsx';

const MODULES = [
  ['RM Details', ['rm_name', 'rm_employee_code', 'rm_designation', 'rm_branch']],
  ['Contact & PAN', ['mobile_number', 'email', 'huf_pan_number', 'huf_pan_itr_name', 'karta_pan_number', 'karta_itr_name',
    'huf_bank_statement_address', 'huf_bank_statement_city', 'huf_bank_statement_district', 'huf_bank_statement_state', 'huf_bank_statement_pincode']],
  ['Bank', ['bank_account_number', 'bank_ifsc_code', 'bank_micr_code', 'bank_account_type', 'bank_name', 'bank_branch_name', 'bank_address',
    'bank_account_status', 'bank_account_holder_name', 'bank_verification_id', 'bank_verification_ref', 'bank_verified_at', 'bank_statement_uploaded_at']],
  ['Karta', ['karta_full_name', 'karta_dob', 'karta_gender', 'karta_father_name', 'karta_mother_name', 'karta_occupation', 'karta_annual_income',
    'karta_net_worth', 'karta_place_of_incorporation', 'karta_aadhaar_last4', 'karta_address', 'karta_city', 'karta_district', 'karta_state', 'karta_pincode']],
  ['Co-parceners', 'COPARCENERS'],
  ['Mobile', ['client_mobile_number', 'mobile_otp_verified', 'mobile_otp_verified_at', 'mobile_otp_attempts']],
  ['Email', ['client_email', 'email_otp_verified', 'email_otp_verified_at', 'email_otp_attempts']],
  ['Consent', ['client_consent', 'client_consent_at', 'declaration_accuracy', 'declaration_consent']],
  ['Payment', 'PAYMENT'],
  ['Live Photo', ['live_photo_uploaded_at', 'live_photo_latitude', 'live_photo_longitude']],
  ['eSign', ['esign_status', 'signature_method', 'signature_signed_at', 'signed_pdf_generated_at', 'completed_at']],
];
const PAYMENT_FIELDS = ['payment_status', 'razorpay_order_id', 'razorpay_payment_id', 'payment_txnid', 'payment_method', 'paid_at',
  'payment_error_code', 'payment_error_description', 'payment_source_verified'];

const fieldLabel = (k) => label(k).replace(/\bHuf\b/g, 'HUF').replace(/\bPan\b/g, 'PAN').replace(/\bIfsc\b/g, 'IFSC').replace(/\bMicr\b/g, 'MICR').replace(/\bOtp\b/g, 'OTP').replace(/\bRm\b/g, 'RM').replace(/\bItr\b/g, 'ITR').replace(/\bDob\b/g, 'DOB');
function show(k, v) {
  if (v === null || v === undefined || v === '') return 'N/A';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (/_at$/.test(k)) return fmtDateTime(v);
  if (k === 'karta_dob') return String(v).split('-').reverse().join('/');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function Fields({ app, keys }) {
  return (
    <dl className="kv">
      {keys.map((k) => (
        <div key={k}>
          <dt>{fieldLabel(k)}</dt>
          <dd>{show(k, app[k])}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ClientDetails({ setTitle }) {
  const { id } = useParams();
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState('RM Details');
  const [doc, setDoc] = useState(null);
  const [preview, setPreview] = useState({ loading: false });
  const [allotMsg, setAllotMsg] = useState('');

  useEffect(() => setTitle('Client Details'), [setTitle]);
  useEffect(() => {
    api(`/api/clients/${id}`)
      .then((r) => {
        setD(r);
        setDoc(r.documents.find((x) => x.available)?.key || r.documents[0]?.key);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!d || !doc) return;
    const meta = d.documents.find((x) => x.key === doc);
    if (!meta?.available) return setPreview({ missing: true, meta });
    let url;
    setPreview({ loading: true, meta });
    blobUrl(`/api/clients/${id}/documents/${doc}`)
      .then((r) => {
        if (r.revoke) url = r.url;
        setPreview({ ...r, meta });
      })
      .catch((e) => setPreview({ error: e.message, meta }));
    return () => url && URL.revokeObjectURL(url);
  }, [d, doc, id]);

  const allot = async () => {
    setAllotMsg('');
    try {
      const r = await api('/api/boid/allot', { method: 'POST', body: { hufId: Number(id) } });
      setD({ ...d, boid: r.boid });
    } catch (e) {
      setAllotMsg(e.message);
    }
  };

  if (error) return <div className="alert error">{error}</div>;
  if (!d) return <div className="muted">Loading…</div>;
  const a = d.app;

  return (
    <>
      <div className="crumbs">
        <Link to="/clients">← Back to Clients</Link>
      </div>
      <div className="card summary-strip">
        <div><span>Unique ID</span><b>{a.unique_id}</b></div>
        <div><span>Client Code</span><b>{a.client_code || 'N/A'} <CopyBtn value={a.client_code} /></b></div>
        <div><span>HUF PAN</span><b>{a.huf_pan_number || 'N/A'} <CopyBtn value={a.huf_pan_number} /></b></div>
        <div><span>Client Name</span><b>{a.huf_pan_itr_name || a.karta_full_name || 'N/A'}</b></div>
        <div><span>Current Stage</span><b>{label(a.huf_stage)}</b></div>
        <div><span>Status</span><b><Badge value={a.huf_status || 'IN_PROGRESS'} text={a.huf_status === 'ESIGNED' ? 'Completed' : 'In Progress'} /></b></div>
        <div>
          <span>BOID</span>
          <b>
            {d.boid ? (
              <>{d.boid.boid} <CopyBtn value={d.boid.boid} /></>
            ) : user.role !== 'VIEWER' ? (
              <button className="btn small primary" onClick={allot}>Allot BOID</button>
            ) : (
              'N/A'
            )}
          </b>
          {allotMsg && <small className="error-text">{allotMsg}</small>}
        </div>
      </div>

      <div className="details-grid">
        <div className="card panel">
          <div className="panel-head">Modules</div>
          {MODULES.map(([name, keys]) => (
            <div key={name} className={`accordion ${open === name ? 'open' : ''}`}>
              <button className="accordion-head" onClick={() => setOpen(open === name ? '' : name)}>
                {name} <ChevronDown size={16} />
              </button>
              {open === name && (
                <div className="accordion-body">
                  {keys === 'COPARCENERS' ? (
                    (a.coparceners || []).length ? (
                      a.coparceners.map((c, i) => (
                        <div key={i} className="sub-block">
                          <b>Co-parcener {i + 1}</b>
                          <Fields app={c} keys={Object.keys(c).filter((k) => !/path|file_name|^id$/.test(k))} />
                        </div>
                      ))
                    ) : (
                      <p className="muted">No co-parceners.</p>
                    )
                  ) : keys === 'PAYMENT' ? (
                    <>
                      <dl className="kv">
                        <div><dt>Amount</dt><dd>{fmtMoney(d.payment?.amount)}</dd></div>
                        <div><dt>Result</dt><dd><Badge value={d.payment?.state} /></dd></div>
                      </dl>
                      <Fields app={a} keys={PAYMENT_FIELDS} />
                    </>
                  ) : (
                    <Fields app={a} keys={keys} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="card panel">
          <div className="panel-head">Documents</div>
          {d.documents.map((x) => (
            <button key={x.key} className={`doc-item ${doc === x.key ? 'active' : ''} ${x.available ? '' : 'missing'}`} onClick={() => setDoc(x.key)}>
              <span>{x.label}</span>
              {x.available ? <FileText size={15} /> : <Pin size={15} className="pin" />}
            </button>
          ))}
        </div>

        <div className="card preview">
          <div className="preview-head">
            <span className="chip">Preview</span>
            {preview.meta?.fileName && <span className="chip outline">{preview.meta.fileName}</span>}
          </div>
          <div className="preview-body">
            {preview.loading && <span className="muted">Loading…</span>}
            {preview.missing && <Empty><b>{preview.meta?.label}</b><br />No file stored for this client.</Empty>}
            {preview.error && <Empty><b>{preview.meta?.label}</b><br />{preview.error}</Empty>}
            {preview.url && (preview.type === 'application/pdf' ? (
              <iframe title={preview.meta.label} src={preview.url} />
            ) : preview.type?.startsWith('image/') ? (
              <img src={preview.url} alt={preview.meta.label} />
            ) : (
              <a className="btn" href={preview.url} download={preview.meta.fileName}>Download file</a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
