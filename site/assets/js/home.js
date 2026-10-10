// 첫 화면: 방문자 OS 에 맞는 최신 설치 파일로 다운로드 버튼을 바꾸고, 최신 버전을 표시한다.
// 불러오기에 실패하면 버튼은 그대로 다운로드 페이지로 간다.
import { initPage, onLocaleChange, t } from './i18n.js';
import { detectPlatform, formatBytes, formatDate, pickAsset, PLATFORM_LABEL } from './lib.js';
import { el, loadReleases } from './releases.js';

initPage();

const button = document.getElementById('hero-download');
const label = document.getElementById('hero-download-label');
const fine = document.getElementById('latest-line');
let latest = null;

function render() {
  if (!latest) return;
  if (fine) {
    fine.replaceChildren(
      t('home.latest', { version: latest.version, date: formatDate(latest.publishedAt) }),
      el('a', { href: '/download#history' }, t('home.changes')),
    );
  }
  const platform = detectPlatform(navigator.userAgent);
  const asset = pickAsset(latest.assets, platform);
  if (asset && button && label) {
    button.href = asset.url;
    label.replaceChildren(
      `${t('home.downloadFor', { platform: PLATFORM_LABEL[platform] })} `,
      el('small', {}, `v${latest.version} · ${formatBytes(asset.size)}`),
    );
  }
}

loadReleases()
  .then((releases) => {
    latest = releases.find((r) => !r.prerelease) ?? releases[0] ?? null;
    render();
  })
  .catch((error) => console.warn('releases', error));

onLocaleChange(render);
