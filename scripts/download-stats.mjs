// GitHub Releases 다운로드 수 보기: node scripts/download-stats.mjs
// GitHub 화면에는 다운로드 수가 안 보이므로 API 로 센다. 비공개 저장소이거나 한도가 걸리면 GITHUB_TOKEN 을 넣는다.
//   (PowerShell) $env:GITHUB_TOKEN = "..." ; node scripts/download-stats.mjs
//   --csv 를 붙이면 날짜,버전,파일,수 를 CSV 로 출력 (날마다 저장해 두면 추이를 볼 수 있다)
import { classifyAsset, REPO } from '../site/assets/js/lib.js';

const headers = { Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, { headers });
if (!res.ok) {
  console.error(`GitHub API ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const releases = (await res.json()).filter((r) => !r.draft);
const csv = process.argv.includes('--csv');
const today = new Date().toISOString().slice(0, 10);
let total = 0;

if (csv) console.log('date,version,file,downloads');
for (const r of releases) {
  // 설치 파일·카트리지만 센다 (latest.yml · blockmap 은 자동 업데이트가 받는 파일이라 제외)
  const assets = r.assets.filter((a) => classifyAsset(a.name));
  const sum = assets.reduce((n, a) => n + a.download_count, 0);
  total += sum;
  if (csv) {
    for (const a of assets) console.log(`${today},${r.tag_name},"${a.name}",${a.download_count}`);
    continue;
  }
  console.log(`${r.tag_name}  ${String(sum).padStart(6)}  (${r.published_at?.slice(0, 10) ?? '-'})`);
  for (const a of assets) console.log(`    ${String(a.download_count).padStart(6)}  ${a.name}`);
}
if (!csv) console.log(`합계 ${total}`);
