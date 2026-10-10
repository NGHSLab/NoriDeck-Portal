// GitHub Releases 를 불러온다. 방문자 브라우저가 GitHub API 를 직접 부르므로
// 같은 탭에서는 10분 동안 sessionStorage 에 담아 두고 다시 쓴다 (API 한도: IP 당 시간 60회).
import { API_URL, toReleases } from './lib.js';

// 화면용 모양이 바뀌면 키를 올린다 (예전 캐시를 버리게)
const CACHE_KEY = 'norideck.releases.v2';
const CACHE_MS = 10 * 60 * 1000;

export async function loadReleases() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null');
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.releases;
  } catch {
    // 저장소를 못 쓰면 매번 부른다
  }
  const res = await fetch(API_URL, {
    // full+json: 릴리스 본문(Markdown)을 GitHub 이 HTML 로 바꾼 body_html 도 함께 받는다
    headers: { Accept: 'application/vnd.github.full+json' },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const releases = toReleases(await res.json());
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), releases }));
  } catch {
    // 무시
  }
  return releases;
}

/** 텍스트만 넣는 작은 요소 생성 도우미 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}
