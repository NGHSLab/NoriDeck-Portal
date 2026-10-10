// 순수 함수 검사: node --test (의존성 없음)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  classifyAsset,
  detectPlatform,
  formatBytes,
  formatDate,
  parseNotes,
  pickAsset,
  splitInlineCode,
  toReleases,
} from '../site/assets/js/lib.js';

const raw = [
  {
    tag_name: 'v0.1.2',
    name: 'v0.1.2',
    body: '- 이전',
    html_url: 'https://github.com/NGHSLab/NoriDeck/releases/tag/v0.1.2',
    published_at: '2026-10-01T00:00:00Z',
    draft: false,
    prerelease: false,
    assets: [],
  },
  { tag_name: 'v0.2.0', draft: true, assets: [] },
  {
    tag_name: 'v0.1.3',
    name: '키 배치 개편',
    body: '# 변경\n- 기본 키 `Y U` · `I O`',
    html_url: 'https://github.com/NGHSLab/NoriDeck/releases/tag/v0.1.3',
    published_at: '2026-10-10T00:00:00Z',
    draft: false,
    prerelease: false,
    assets: [
      {
        name: 'NoriDeck Setup 0.1.3.exe',
        size: 90_000_000,
        browser_download_url: 'https://x/setup',
        download_count: 12,
        digest: 'sha256:' + 'a'.repeat(64),
      },
      { name: 'NoriDeck Setup 0.1.3.exe.blockmap', size: 1, browser_download_url: 'https://x/bm', download_count: 3 },
      { name: 'latest.yml', size: 1, browser_download_url: 'https://x/yml', download_count: 40 },
      { name: 'NoriDeck 0.1.3.exe', size: 80_000_000, browser_download_url: 'https://x/portable', download_count: 2 },
      { name: 'snake-1.0.0.nori', size: 20_000, browser_download_url: 'https://x/snake', download_count: 1 },
    ],
  },
];

test('classifyAsset follows electron-builder default names', () => {
  assert.deepEqual(classifyAsset('NoriDeck Setup 0.1.3.exe'), { platform: 'WINDOWS', kind: 'INSTALLER' });
  assert.deepEqual(classifyAsset('NoriDeck 0.1.3.exe'), { platform: 'WINDOWS', kind: 'PORTABLE' });
  assert.deepEqual(classifyAsset('norideck-0.1.3-linux-x64.tar.gz'), { platform: 'LINUX', kind: 'PORTABLE' });
  assert.deepEqual(classifyAsset('NoriDeck-0.1.3.AppImage'), { platform: 'LINUX', kind: 'INSTALLER' });
  assert.deepEqual(classifyAsset('snake-1.0.0.nori'), { platform: null, kind: 'CARTRIDGE' });
  assert.equal(classifyAsset('NoriDeck Setup 0.1.3.exe.blockmap'), null);
  assert.equal(classifyAsset('latest.yml'), null);
  assert.equal(classifyAsset('source.zip'), null);
});

test('toReleases drops drafts, sorts newest first and keeps only visible assets', () => {
  const list = toReleases(raw);
  assert.deepEqual(
    list.map((r) => r.version),
    ['0.1.3', '0.1.2'],
  );
  const latest = list[0];
  assert.equal(latest.title, '키 배치 개편');
  assert.deepEqual(
    latest.assets.map((a) => a.name),
    ['NoriDeck Setup 0.1.3.exe', 'NoriDeck 0.1.3.exe', 'snake-1.0.0.nori'],
  );
  assert.equal(latest.assets[0].sha256, 'a'.repeat(64));
  assert.equal(latest.assets[1].sha256, null);
  assert.equal(latest.notesHtml, '');
  assert.deepEqual(toReleases(null), []);
});

test('assets are ordered installer first, as GitHub renames spaces to dots', () => {
  const [release] = toReleases([
    {
      tag_name: 'v0.1.3',
      published_at: '2026-10-10T00:00:00Z',
      assets: [
        { name: 'snake-1.0.0.nori', size: 1, browser_download_url: 'a' },
        { name: 'NoriDeck-0.1.3-linux-x64.tar.gz', size: 1, browser_download_url: 'b' },
        { name: 'NoriDeck.0.1.3.exe', size: 1, browser_download_url: 'c' },
        { name: 'NoriDeck.Setup.0.1.3.exe', size: 1, browser_download_url: 'd' },
      ],
    },
  ]);
  assert.deepEqual(
    release.assets.map((a) => `${a.platform}:${a.kind}`),
    ['WINDOWS:INSTALLER', 'WINDOWS:PORTABLE', 'LINUX:PORTABLE', 'null:CARTRIDGE'],
  );
});

test('toRelease keeps GitHub rendered notes html', () => {
  const [r] = toReleases([{ tag_name: 'v1.0.0', body: '**a**', body_html: '<p><strong>a</strong></p>', assets: [] }]);
  assert.equal(r.notes, '**a**');
  assert.equal(r.notesHtml, '<p><strong>a</strong></p>');
});

test('pickAsset prefers the installer', () => {
  const [latest] = toReleases(raw);
  assert.equal(pickAsset(latest.assets, 'WINDOWS').kind, 'INSTALLER');
  assert.equal(
    pickAsset(
      latest.assets.filter((a) => a.kind !== 'INSTALLER'),
      'WINDOWS',
    ).kind,
    'PORTABLE',
  );
  assert.equal(pickAsset(latest.assets, 'LINUX'), undefined);
});

test('detectPlatform', () => {
  assert.equal(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'WINDOWS');
  assert.equal(detectPlatform('Mozilla/5.0 (X11; Linux x86_64)'), 'LINUX');
  assert.equal(detectPlatform('Mozilla/5.0 (Linux; Android 14)'), 'WINDOWS');
  assert.equal(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)'), 'MACOS');
});

test('formatBytes / formatDate', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(88_080_384), '84.0 MB');
  assert.equal(formatBytes(150 * 1024 * 1024), '150 MB');
  assert.equal(formatDate('2026-10-03T16:00:00Z'), '2026-10-04');
  assert.equal(formatDate(undefined), '-');
});

test('parseNotes / splitInlineCode never produce HTML', () => {
  assert.deepEqual(parseNotes('# 변경\n- a\n- b\n\n문단 `코드`'), [
    { type: 'h', text: '변경' },
    { type: 'list', items: ['a', 'b'] },
    { type: 'p', text: '문단 `코드`' },
  ]);
  assert.deepEqual(splitInlineCode('키 `Y U` 변경'), [
    { code: false, text: '키 ' },
    { code: true, text: 'Y U' },
    { code: false, text: ' 변경' },
  ]);
  assert.deepEqual(parseNotes('<img src=x onerror=alert(1)>'), [{ type: 'p', text: '<img src=x onerror=alert(1)>' }]);
});
