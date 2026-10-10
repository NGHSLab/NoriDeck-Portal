// 화면 문구 사전.
// - 정적 문구: HTML 안의 한국어가 원본이고(data-i18n · data-i18n-html · data-i18n-attr), 여기에는 영어만 둔다
// - JS 가 만드는 문구(dynamic): 한국어 · 영어 둘 다
// 키 누락은 tests/i18n.test.mjs 가 잡는다. data-i18n-html 값은 우리가 쓴 문자열만 (외부 값을 넣지 않는다)

const HUB = 'https://tst.norihub.org';

/** HTML 정적 문구의 영어판 */
export const staticEn = {
  'title.home': 'NoriDeck',
  'title.download': 'Download · NoriDeck',
  'meta.description': 'NoriDeck console downloads, how-to and links',
  'meta.downloadDescription': 'NoriDeck console installers and release notes',
  'nav.skip': 'Skip to content',
  'nav.menu': 'Main menu',
  'nav.guide': 'How to use',
  'nav.dev': 'Make cartridges',
  'nav.releases': 'Release notes',
  'nav.download': 'Download',
  'nav.language': 'Language',

  'home.lead':
    'NoriDeck is a desktop game console that runs <b class="strong">.nori</b> cartridges. Get the console here, and find out how to use it and where to go next.',
  'home.download': 'Download',
  'home.hubButton': 'Find cartridges on NoriHub ↗',
  'home.changes': 'Changes',
  'home.imageAlt': 'NoriDeck console',

  'guide.title': 'How to use',
  'guide.install.title': 'Install',
  'guide.install.body':
    'Get the installer (.exe) from <a href="/download">Download</a> and run it. To use it without installing, put the portable executable in any folder and create a <code>norirepo</code> folder next to it — all data is then stored inside it.',
  'guide.add.title': 'Add cartridges',
  'guide.add.body': `Drag a <code>.nori</code> file from <a href="${HUB}" target="_blank" rel="noopener noreferrer">NoriHub</a> onto the home screen, or use <b>File → Add cartridge</b>. Added cartridges are kept in your library, and their checksum is verified before they open.`,
  'guide.play.title': 'Play',
  'guide.play.body':
    'Pick a card on the home screen (← → or mouse wheel) and press <b>Play</b> or <kbd>Enter</kbd>. During a game, <kbd>P</kbd> takes you home with the game paused; press <kbd>P</kbd> again or click its card to resume. Starting another cartridge closes the paused game.',
  'guide.saves.title': 'Saves and cartridges',
  'guide.saves.body':
    "From a card's gear menu (or right-click) you can back up (zip), restore or clear saves, export the cartridge, quit the game or delete it. Deleting a cartridge keeps its saves, so you can pick up where you left off after adding it again.",
  'facts.settings.title': 'Settings',
  'facts.settings.body':
    'The <b>Config</b> menu sets the language (English · 한국어), controls, volume and game speed (×1.5 – ×4). Window size is under <b>View</b> (×0.5 · ×1 · ×1.5), and <kbd>F11</kbd> toggles fullscreen.',
  'facts.data.title': 'Where data lives',
  'facts.data.body':
    'By default in <code>%APPDATA%\\norideck</code>, or in <code>norirepo\\</code> in portable mode. Each cartridge is one <code>games\\&lt;id&gt;\\</code> folder, with its saves in <code>saves\\</code>. Open them from the Config menu (game folder · data folder); copying a folder backs up the game and its saves together.',

  'keys.title': 'Default keys',
  'keys.lead':
    'In Config → Controls, click a button slot on the console drawing and press a new key — it changes right away (Esc cancels).',
  'keys.dpad': 'D-pad (arrow keys work too)',
  'keys.home': 'Home / resume',
  'keys.speed': 'Speed on · off (default ×3)',
  'keys.fullscreen': 'Fullscreen',

  'dev.title': 'Make cartridges',
  'dev.body':
    'Cartridges are written in TypeScript. Start with <code>npm create nori</code> — no NoriDeck repository needed — and build a .nori file with <code>nori build</code>. The default screen is 16:9 at 480×270, set in the manifest (<code>nori.json</code>).',
  'dev.hub': `To publish, sign in to <a href="${HUB}" target="_blank" rel="noopener noreferrer" style="color: var(--mint-ink)">NoriHub</a> and upload your .nori file. It goes live as soon as it passes the checks.`,

  'links.title': 'Links',
  'links.hub': 'Find, download and publish cartridges (test server)',
  'links.download.title': 'Download',
  'links.download.desc': 'Installer · portable · release notes',
  'links.releases.title': 'Release notes',
  'links.releases.desc': 'Changes by version',
  'links.sdk.desc': 'npm package for cartridge development',

  'dl.heading': 'Install NoriDeck',
  'dl.loading': 'Loading…',
  'install.title': 'Installing on Windows',
  'install.1': 'Download and run the installer (<code>NoriDeck.Setup.x.y.z.exe</code>).',
  'install.2':
    'If “Windows protected your PC” appears, click <b class="strong">More info → Run anyway</b>. The app isn\'t code-signed yet.',
  'install.3': 'Drag a .nori cartridge onto the home screen, or use File → Add cartridge.',
  'portable.title': 'Portable use',
  'portable.1': 'Put the portable executable (<code>NoriDeck.x.y.z.exe</code>) in any folder (a USB drive works too).',
  'portable.2': 'Create a <code>norirepo</code> folder next to it, and games and saves are all stored inside.',
  'req.title': 'System requirements',
  'req.os': '<b>OS</b>Windows 10 or later (x64)',
  'req.input': '<b>Input</b>Keyboard',
  'history.title': 'Release notes',

  'nf.title': 'Page not found',
  'nf.home': 'Go home',
};

/** JS 가 만드는 문구 ({이름} 은 값으로 바뀐다) */
export const dynamic = {
  ko: {
    'home.downloadFor': '{platform}용 다운로드',
    'home.latest': '최신 v{version} · {date} · ',
    'home.changes': '변경 내역',
    'dl.latest': '최신 버전 ',
    'dl.preview': '미리보기',
    'dl.viewOnGithub': 'GitHub 에서 보기 ↗',
    'dl.table': '설치 파일',
    'dl.col.platform': '플랫폼',
    'dl.col.type': '형식',
    'dl.col.size': '크기',
    'dl.button': '다운로드',
    'dl.buttonLabel': '{name} 다운로드',
    'dl.req.WINDOWS': 'Windows 10 이상 · x64',
    'dl.req.LINUX': 'x64 · GNOME / KDE',
    'dl.comingSoon': '준비 중',
    'dl.sample': '처음 써 볼 카트리지: {link} (받아서 홈 화면에 끌어다 놓기)',
    'dl.error': '릴리스 정보를 불러오지 못했습니다. {link} 에서 직접 받을 수 있습니다.',
    'dl.empty': '아직 공개된 버전이 없습니다.',
    'dl.historyEmpty': '아직 공개된 릴리스가 없습니다.',
    'notes.empty': '변경 내역이 없습니다.',
    'kind.INSTALLER': '설치 파일',
    'kind.PORTABLE': '포터블',
    'kind.CARTRIDGE': '샘플 카트리지',
  },
  en: {
    'home.downloadFor': 'Download for {platform}',
    'home.latest': 'Latest v{version} · {date} · ',
    'home.changes': 'Changes',
    'dl.latest': 'Latest version ',
    'dl.preview': 'Preview',
    'dl.viewOnGithub': 'View on GitHub ↗',
    'dl.table': 'Downloads',
    'dl.col.platform': 'Platform',
    'dl.col.type': 'Type',
    'dl.col.size': 'Size',
    'dl.button': 'Download',
    'dl.buttonLabel': 'Download {name}',
    'dl.req.WINDOWS': 'Windows 10 or later · x64',
    'dl.req.LINUX': 'x64 · GNOME / KDE',
    'dl.comingSoon': 'Coming soon',
    'dl.sample': 'Try a cartridge first: {link} (download it and drag it onto the home screen)',
    'dl.error': "Couldn't load release information. You can download directly from {link}.",
    'dl.empty': 'No version has been released yet.',
    'dl.historyEmpty': 'No releases yet.',
    'notes.empty': 'No notes.',
    'kind.INSTALLER': 'Installer',
    'kind.PORTABLE': 'Portable',
    'kind.CARTRIDGE': 'Sample cartridge',
  },
};
