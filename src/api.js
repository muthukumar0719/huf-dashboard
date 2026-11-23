// Thin fetch wrapper.
// API address: window.HUF_DASHBOARD_API from /config.js (editable after deploy, no rebuild), else
// VITE_API_BASE at build time, else '' (same origin; the Vite proxy in development).
const BASE = String(window.HUF_DASHBOARD_API || import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

// Session token for a cross-domain API (sent as a Bearer header). sessionStorage: ends with the tab.
const TOKEN_KEY = 'huf-dash-token';
const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
};
const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`);
    this.status = status;
    this.code = body?.code;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

export async function api(path, { method = 'GET', body, form } = {}) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: { ...authHeaders(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: form || (body ? JSON.stringify(body) : undefined),
  }).catch((e) => {
    throw new ApiError(0, { message: `Could not reach the server${BASE ? ` at ${BASE}` : ''} (${e.message}).` });
  });
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/api/auth/login')) {
      setToken(null);
      onUnauthorized();
    }
    throw new ApiError(res.status, data);
  }
  if (data?.token) setToken(data.token);
  if (path === '/api/auth/logout') setToken(null);
  return data;
}

export const qs = (o) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== '' && v !== null && v !== undefined)).toString();

// Downloads a file endpoint (CSV export) using the session cookie.
export async function download(path, fallbackName) {
  const res = await fetch(BASE + path, { credentials: 'include', headers: authHeaders() });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  const name = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// A document preview: S3 files come back as { url } (a short-lived signed link), local files as bytes.
// `revoke` is true when the url is an object URL the caller must release.
export async function blobUrl(path) {
  const res = await fetch(BASE + path, { credentials: 'include', headers: authHeaders() });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  if (res.headers.get('content-type')?.includes('application/json')) {
    const j = await res.json();
    return { url: j.url, type: j.type, revoke: false };
  }
  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), type: blob.type, revoke: true };
}

export const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-GB') : 'N/A');
export const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'N/A';
export const fmtMoney = (v) =>
  v === null || v === undefined ? 'N/A' : '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const label = (s) => (s ? String(s).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : 'N/A');
