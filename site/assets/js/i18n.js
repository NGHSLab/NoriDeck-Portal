// 언어 전환 (ko · en). 기본 한국어, 고른 언어는 localStorage 에 남는다.
// 정적 문구는 HTML 의 한국어가 원본 — 처음 한 번 원본을 기억해 두고, 영어면 사전 값으로, 한국어면 원본으로 바꾼다.
import { dynamic, staticEn } from './messages.js';

export const LOCALES = ['ko', 'en'];
const STORAGE_KEY = 'norideck.locale';
const listeners = new Set();
const originals = new Map(); // 요소 → { text?, html?, attrs: {name: value} }
let fallbackLocale = null; // localStorage 를 못 쓸 때 이번 페이지에서만 쓰는 값

export function getLocale() {
  if (fallbackLocale) return fallbackLocale;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LOCALES.includes(saved)) return saved;
  } catch {
    // 저장소를 못 쓰면 기본값
  }
  return 'ko';
}

/** JS 가 만드는 문구. {name} 치환 */
export function t(key, vars = {}) {
  const locale = getLocale();
  const text = dynamic[locale]?.[key] ?? dynamic.ko[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

/**
 * {link} 같은 자리에 요소를 끼워 넣은 조각 목록. el() 의 자식으로 쓴다.
 *   tParts('dl.error', { link: el('a', …) }) → ['…', <a>, '…']
 */
export function tParts(key, nodes) {
  const template = t(key, {});
  return template.split(/(\{\w+\})/g).map((part) => {
    const m = /^\{(\w+)\}$/.exec(part);
    return m && nodes[m[1]] ? nodes[m[1]] : part;
  });
}

function remember(node) {
  if (originals.has(node)) return originals.get(node);
  const saved = { attrs: {} };
  if (node.hasAttribute('data-i18n')) saved.text = node.textContent;
  if (node.hasAttribute('data-i18n-html')) saved.html = node.innerHTML;
  for (const [name] of parseAttrSpec(node.getAttribute('data-i18n-attr'))) saved.attrs[name] = node.getAttribute(name);
  originals.set(node, saved);
  return saved;
}

function parseAttrSpec(spec) {
  return (spec ?? '')
    .split(';')
    .map((pair) => pair.split(':').map((s) => s.trim()))
    .filter(([name, key]) => name && key);
}

/** 문서의 정적 문구를 현재 언어로 */
export function applyStatic(root = document) {
  const en = getLocale() === 'en';
  for (const node of root.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-attr]')) {
    const saved = remember(node);
    const textKey = node.getAttribute('data-i18n');
    if (textKey) node.textContent = en ? (staticEn[textKey] ?? saved.text) : saved.text;
    const htmlKey = node.getAttribute('data-i18n-html');
    if (htmlKey) node.innerHTML = en ? (staticEn[htmlKey] ?? saved.html) : saved.html;
    for (const [name, key] of parseAttrSpec(node.getAttribute('data-i18n-attr'))) {
      node.setAttribute(name, en ? (staticEn[key] ?? saved.attrs[name]) : saved.attrs[name]);
    }
  }
  document.documentElement.lang = getLocale();
  document.documentElement.classList.remove('i18n-pending');
}

export function setLocale(locale) {
  if (!LOCALES.includes(locale) || locale === getLocale()) return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // 저장 못 해도 이번 페이지에는 적용
    fallbackLocale = locale;
  }
  applyStatic();
  for (const fn of listeners) fn(locale);
}

/** 언어가 바뀌면 다시 그릴 화면을 등록한다 */
export function onLocaleChange(fn) {
  listeners.add(fn);
}

/** 헤더의 지구본 메뉴 */
export function mountLanguageMenu() {
  const box = document.getElementById('lang');
  if (!box) return;
  const button = box.querySelector('.lang-btn');
  const menu = box.querySelector('.lang-menu');
  const items = [...menu.querySelectorAll('[data-locale]')];

  const mark = () => {
    for (const item of items) item.setAttribute('aria-checked', String(item.dataset.locale === getLocale()));
  };
  const open = (yes) => {
    menu.hidden = !yes;
    button.setAttribute('aria-expanded', String(yes));
    if (yes) (items.find((i) => i.dataset.locale === getLocale()) ?? items[0]).focus();
  };

  mark();
  button.addEventListener('click', () => open(menu.hidden));
  for (const item of items) {
    item.addEventListener('click', () => {
      setLocale(item.dataset.locale);
      mark();
      open(false);
      button.focus();
    });
  }
  document.addEventListener('click', (e) => {
    if (!box.contains(e.target)) open(false);
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      open(false);
      button.focus();
    }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !menu.hidden) {
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
    }
  });
}

/** 모든 페이지 공통 시작 */
export function initPage() {
  applyStatic();
  mountLanguageMenu();
}
