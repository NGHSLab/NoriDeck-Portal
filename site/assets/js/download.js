// 다운로드 페이지: 최신 릴리스의 파일 표 + 지난 버전 목록(릴리스 노트).
// 릴리스 노트 본문은 GitHub 에 쓴 그대로 보여 준다 (번역하지 않음).
import DOMPurify from '../vendor/purify.es.js';
import { initPage, onLocaleChange, t, tParts } from './i18n.js';
import {
  detectPlatform,
  formatBytes,
  formatDate,
  parseNotes,
  PLATFORM_LABEL,
  RELEASES_URL,
  splitInlineCode,
} from './lib.js';
import { el, loadReleases } from './releases.js';

initPage();

// 표에 보이는 플랫폼 (macOS 는 목표가 아니라 표시하지 않는다). Linux 는 파일이 없으면 "준비 중"
const PLATFORMS = ['WINDOWS', 'LINUX'];

const latestBox = document.getElementById('latest');
const historyBox = document.getElementById('history-list');
/** 'loading' | 'error' | releases 배열 */
let state = 'loading';

function inline(text) {
  return splitInlineCode(text).map((part) => (part.code ? el('code', {}, part.text) : part.text));
}

// GitHub 이 만든 HTML 이라도 한 번 더 정화한다: 스크립트·이벤트 속성·iframe·form 제거, 링크는 새 탭
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

function notesFromHtml(html) {
  const box = el('div', { class: 'notes markdown' });
  box.innerHTML = DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe', 'video', 'audio'],
    FORBID_ATTR: ['style'],
  });
  return box;
}

function notes(release) {
  if (release.notesHtml.trim()) return notesFromHtml(release.notesHtml);
  // body_html 이 없을 때(예전 캐시 등)는 간단한 자체 파서로
  const blocks = parseNotes(release.notes);
  if (blocks.length === 0) return el('p', { class: 'muted' }, t('notes.empty'));
  return el(
    'div',
    { class: 'notes' },
    blocks.map((b) =>
      b.type === 'h'
        ? el('h3', {}, inline(b.text))
        : b.type === 'list'
          ? el(
              'ul',
              {},
              b.items.map((item) => el('li', {}, inline(item))),
            )
          : el('p', {}, inline(b.text)),
    ),
  );
}

function assetRow(asset, mine) {
  return el(
    'div',
    { class: `row${mine ? ' mine' : ''}`, role: 'row' },
    el(
      'span',
      {},
      el('b', {}, PLATFORM_LABEL[asset.platform]),
      el('span', { class: 'sub' }, t(`dl.req.${asset.platform}`)),
    ),
    el('span', { class: 'muted opt' }, `${t(`kind.${asset.kind}`)} · ${asset.name}`),
    el('span', { class: 'muted opt' }, formatBytes(asset.size)),
    el(
      'a',
      { class: 'btn btn-ghost btn-sm', href: asset.url, 'aria-label': t('dl.buttonLabel', { name: asset.name }) },
      t('dl.button'),
    ),
  );
}

function unavailableRow(platform) {
  return el(
    'div',
    { class: 'row', role: 'row' },
    el('span', {}, el('b', {}, PLATFORM_LABEL[platform]), el('span', { class: 'sub' }, t(`dl.req.${platform}`))),
    el('span', { class: 'muted opt' }, '-'),
    el('span', { class: 'muted opt' }, '-'),
    el('span', { class: 'pill' }, t('dl.comingSoon')),
  );
}

function renderLatest(release) {
  const mine = detectPlatform(navigator.userAgent);
  const rows = PLATFORMS.flatMap((p) => {
    const assets = release.assets.filter((a) => a.platform === p);
    return assets.length ? assets.map((a) => assetRow(a, p === mine)) : [unavailableRow(p)];
  });
  const cart = release.assets.find((a) => a.kind === 'CARTRIDGE');
  // 없는 항목(샘플 카트리지 등)이 "undefined" 글자로 찍히지 않게 걸러서 넣는다
  const children = [
    el(
      'p',
      { class: 'muted' },
      t('dl.latest'),
      el('b', { class: 'strong' }, `v${release.version}`),
      release.prerelease && [' ', el('span', { class: 'pill alpha' }, t('dl.preview'))],
      ` · ${formatDate(release.publishedAt)} · `,
      el('a', { href: release.url, style: 'color: var(--mint-ink)' }, t('dl.viewOnGithub')),
    ),
    el(
      'div',
      { class: 'table', role: 'table', 'aria-label': t('dl.table') },
      el(
        'div',
        { class: 'row head', role: 'row' },
        el('span', {}, t('dl.col.platform')),
        el('span', { class: 'opt' }, t('dl.col.type')),
        el('span', { class: 'opt' }, t('dl.col.size')),
        el('span'),
      ),
      rows,
    ),
    cart &&
      el(
        'p',
        { class: 'muted', style: 'margin-top: 12px; font-size: 14px' },
        tParts('dl.sample', { link: el('a', { href: cart.url, style: 'color: var(--mint-ink)' }, cart.name) }),
      ),
  ];
  latestBox.replaceChildren(...children.filter(Boolean));
}

function renderHistory(releases) {
  historyBox.replaceChildren(
    ...releases.map((r) =>
      el(
        'article',
        { class: 'panel', id: `v${r.version}` },
        el(
          'header',
          { class: 'release-head' },
          el('h3', {}, `v${r.version}`),
          r.prerelease && el('span', { class: 'pill alpha' }, t('dl.preview')),
          el('span', { class: 'muted' }, formatDate(r.publishedAt)),
        ),
        r.title && r.title !== r.version && r.title !== `v${r.version}` && el('p', { class: 'strong' }, r.title),
        notes(r),
      ),
    ),
  );
}

function render() {
  if (state === 'loading') return;
  if (state === 'error') {
    latestBox.replaceChildren(
      el(
        'p',
        { class: 'notice' },
        tParts('dl.error', {
          link: el('a', { href: RELEASES_URL, style: 'color: inherit; font-weight: 600' }, 'GitHub Releases ↗'),
        }),
      ),
    );
    historyBox.replaceChildren();
    return;
  }
  if (state.length === 0) {
    latestBox.replaceChildren(el('p', { class: 'notice' }, t('dl.empty')));
    historyBox.replaceChildren(el('p', { class: 'muted' }, t('dl.historyEmpty')));
    return;
  }
  renderLatest(state.find((r) => !r.prerelease) ?? state[0]);
  renderHistory(state);
}

loadReleases()
  .then((releases) => {
    state = releases;
    render();
  })
  .catch((error) => {
    console.warn('releases', error);
    state = 'error';
    render();
  });

onLocaleChange(render);
