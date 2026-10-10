// 번역 사전 검사: HTML 의 data-i18n 키가 모두 영어판에 있는지, JS 문구가 두 언어 모두 있는지
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { dynamic, staticEn } from '../site/assets/js/messages.js';

const site = new URL('../site/', import.meta.url);
const read = (name) => readFileSync(new URL(name, site), 'utf8');
const htmlFiles = readdirSync(site).filter((f) => f.endsWith('.html'));

function htmlKeys() {
  const keys = new Set();
  for (const file of htmlFiles) {
    const html = read(file);
    for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) keys.add(m[1]);
    for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
      for (const pair of m[1].split(';')) keys.add(pair.split(':')[1].trim());
    }
  }
  return keys;
}

test('every static key in HTML has an English translation', () => {
  const missing = [...htmlKeys()].filter((k) => !(k in staticEn));
  assert.deepEqual(missing, []);
});

test('English static dictionary has no unused keys', () => {
  const used = htmlKeys();
  assert.deepEqual(
    Object.keys(staticEn).filter((k) => !used.has(k)),
    [],
  );
});

test('dynamic messages exist in both languages with the same placeholders', () => {
  assert.deepEqual(Object.keys(dynamic.en).sort(), Object.keys(dynamic.ko).sort());
  const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const key of Object.keys(dynamic.ko)) {
    assert.deepEqual(vars(dynamic.en[key]), vars(dynamic.ko[key]), key);
  }
});

test('every t() / tParts() key used in page scripts exists', () => {
  const js = ['home.js', 'download.js'].map((f) => read(`assets/js/${f}`)).join('\n');
  const used = new Set();
  for (const m of js.matchAll(/\bt(?:Parts)?\('([\w.]+)'/g)) used.add(m[1]);
  // 템플릿 키(t(`kind.${…}`), t(`dl.req.${…}`))는 값 목록으로 확인
  for (const k of ['INSTALLER', 'PORTABLE', 'CARTRIDGE']) used.add(`kind.${k}`);
  for (const p of ['WINDOWS', 'LINUX']) used.add(`dl.req.${p}`);
  assert.deepEqual(
    [...used].filter((k) => !(k in dynamic.ko)),
    [],
  );
});

test('every page has the language menu and boots the locale first', () => {
  for (const file of htmlFiles) {
    const html = read(file);
    assert.match(html, /id="lang"/, file);
    assert.ok(html.indexOf('locale-boot.js') < html.indexOf('type="module"'), file);
  }
});
