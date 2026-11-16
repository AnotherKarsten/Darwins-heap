// Tiny translation layer: t('key', {vars}), DOM attributes data-i18n*, language detection.

import en from './en.js';
import de from './de.js';

const DICTS = { en, de };
export const LANGS = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
];

let lang = 'en';

/** Saved choice first, then the browser languages, then English. */
export function detectLang(saved) {
  if (saved && DICTS[saved]) return saved;
  const list = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (const l of list) if (l && l.toLowerCase().startsWith('de')) return 'de';
  return 'en';
}

export function setLang(code) {
  lang = DICTS[code] ? code : 'en';
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

export const getLang = () => lang;
export const dict = () => DICTS[lang];
export const locale = () => (lang === 'de' ? 'de-DE' : 'en-US');

/** Looks up a UI string. Values may be strings with {placeholders} or functions. */
export function t(key, vars = {}) {
  const v = DICTS[lang].ui[key] ?? DICTS.en.ui[key];
  if (v == null) return key;
  if (typeof v === 'function') return v(vars);
  return v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

/** Translates every element with data-i18n, -html, -title, -aria or -placeholder. */
export function applyDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.title = t('doc.title');
}
