// 화면(DOM)과 무관한 순수 함수 모음. node --test 로 바로 검사한다 (tests/lib.test.mjs).

/** 설치 파일이 올라가는 저장소 (GitHub Releases) */
export const REPO = 'NGHSLab/NoriDeck';
export const RELEASES_URL = `https://github.com/${REPO}/releases`;
export const API_URL = `https://api.github.com/repos/${REPO}/releases?per_page=20`;

export const PLATFORM_LABEL = { WINDOWS: 'Windows', LINUX: 'Linux', MACOS: 'macOS' };

/**
 * Release 첨부 파일 이름 → 종류. 화면에 안 보일 파일(blockmap, latest.yml 등)은 null.
 * electron-builder 기본 이름 기준: "NoriDeck Setup 0.1.3.exe"(nsis) · "NoriDeck 0.1.3.exe"(portable).
 * GitHub 에 올리면 공백이 점으로 바뀐다: "NoriDeck.Setup.0.1.3.exe" · "NoriDeck.0.1.3.exe"
 */
export function classifyAsset(name) {
  const n = name.toLowerCase();
  if (n.endsWith('.blockmap') || n.endsWith('.yml') || n.endsWith('.yaml') || n.endsWith('.json')) return null;
  if (n.endsWith('.nori')) return { platform: null, kind: 'CARTRIDGE' };
  if (n.endsWith('.exe')) return { platform: 'WINDOWS', kind: /setup|install/.test(n) ? 'INSTALLER' : 'PORTABLE' };
  if (n.endsWith('.appimage') || n.endsWith('.deb') || n.endsWith('.rpm'))
    return { platform: 'LINUX', kind: 'INSTALLER' };
  if (/\.(zip|7z|tar\.gz|tgz|tar\.xz)$/.test(n)) {
    if (/linux/.test(n)) return { platform: 'LINUX', kind: 'PORTABLE' };
    if (/win/.test(n)) return { platform: 'WINDOWS', kind: 'PORTABLE' };
    return null;
  }
  if (n.endsWith('.dmg')) return { platform: 'MACOS', kind: 'INSTALLER' };
  return null;
}

const PLATFORM_ORDER = ['WINDOWS', 'LINUX', 'MACOS', null];
const KIND_ORDER = ['INSTALLER', 'PORTABLE', 'CARTRIDGE'];

/** 표 순서: 플랫폼(Windows → Linux → macOS → 카트리지), 같은 플랫폼에서는 설치 파일 → 포터블 */
function byPlatformThenKind(a, b) {
  return (
    PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform) ||
    KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
  );
}

/** GitHub API 의 release 하나 → 화면용 모양. 초안(draft)은 null */
export function toRelease(raw) {
  if (!raw || raw.draft) return null;
  const assets = (raw.assets ?? [])
    .map((a) => {
      const type = classifyAsset(a.name);
      if (!type) return null;
      return {
        ...type,
        name: a.name,
        size: a.size,
        url: a.browser_download_url,
        downloads: a.download_count ?? 0,
        sha256: typeof a.digest === 'string' && a.digest.startsWith('sha256:') ? a.digest.slice(7) : null,
      };
    })
    .filter(Boolean)
    .sort(byPlatformThenKind);
  return {
    version: String(raw.tag_name ?? '').replace(/^v/, ''),
    title: raw.name || raw.tag_name || '',
    notes: raw.body ?? '',
    // GitHub 이 렌더링한 릴리스 노트 HTML (full+json 요청일 때만 온다). 화면에 넣기 전에 다시 정화한다
    notesHtml: typeof raw.body_html === 'string' ? raw.body_html : '',
    url: raw.html_url,
    publishedAt: raw.published_at,
    prerelease: Boolean(raw.prerelease),
    assets,
  };
}

/** 최신순 release 목록 (초안 제외) */
export function toReleases(rawList) {
  return (Array.isArray(rawList) ? rawList : [])
    .map(toRelease)
    .filter(Boolean)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
}

/** 방문자 OS 추정. 모르면 Windows (1순위 지원) */
export function detectPlatform(userAgent = '') {
  if (/Windows/i.test(userAgent)) return 'WINDOWS';
  if (/Macintosh|Mac OS X/i.test(userAgent) && !/iPhone|iPad/i.test(userAgent)) return 'MACOS';
  if (/Linux/i.test(userAgent) && !/Android/i.test(userAgent)) return 'LINUX';
  return 'WINDOWS';
}

/** 플랫폼 대표 파일: 설치 파일 우선, 그다음 포터블 */
export function pickAsset(assets, platform) {
  const list = assets.filter((a) => a.platform === platform);
  return list.find((a) => a.kind === 'INSTALLER') ?? list[0];
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

/** ISO 시각 → 서울 기준 YYYY-MM-DD */
export function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
}

/**
 * 릴리스 노트(Markdown 일부) → 블록 목록. # 제목 · - 목록 · 빈 줄 문단 · `코드`.
 * HTML 은 해석하지 않는다 (화면에는 textContent 로만 넣는다).
 */
export function parseNotes(text) {
  const blocks = [];
  let list = [];
  let para = [];
  const flush = () => {
    if (list.length) blocks.push({ type: 'list', items: list });
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    list = [];
    para = [];
  };
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const item = /^[-*]\s+(.*)$/.exec(line);
    if (!line) flush();
    else if (heading) {
      flush();
      blocks.push({ type: 'h', text: heading[1] });
    } else if (item) {
      if (para.length) flush();
      list.push(item[1]);
    } else {
      if (list.length) flush();
      para.push(line);
    }
  }
  flush();
  return blocks;
}

/** `코드` 를 나눈 조각 목록: [{code:false,text}, {code:true,text}] */
export function splitInlineCode(text) {
  return String(text)
    .split(/(`[^`]+`)/g)
    .filter((part) => part !== '')
    .map((part) =>
      part.length > 1 && part.startsWith('`') && part.endsWith('`')
        ? { code: true, text: part.slice(1, -1) }
        : { code: false, text: part },
    );
}
