// Saving in the browser and sharing via link – both fault-tolerant.

const PREFIX = 'darwins-heap:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable – the game still works */
  }
}

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Creates a link that contains all programs. */
export function shareUrl(slots) {
  const data = slots.map((s) => (s.kind === 'bot' ? { b: s.botId } : { n: s.name, c: s.code }));
  const url = new URL(location.href);
  url.hash = 'heap=' + toBase64Url(JSON.stringify({ v: 1, s: data }));
  return url.toString();
}

export function readShared() {
  const m = /heap=([A-Za-z0-9_-]+)/.exec(location.hash);
  if (!m) return null;
  try {
    const obj = JSON.parse(fromBase64Url(m[1]));
    if (!obj || !Array.isArray(obj.s)) return null;
    return obj.s.slice(0, 4);
  } catch {
    return null;
  }
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
