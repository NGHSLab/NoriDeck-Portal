# CLAUDE.md — NoriDeck Portal 작업 규칙

NoriDeck 콘솔 소개 · 설치 안내 정적 사이트. 상용 제품이 아니므로 홍보 문구(슬로건 · 장점 나열 · 배너)는 넣지 않고 사용법과 링크 위주로 간결하게 쓴다.
콘솔 본체 저장소(NGHSLab/NoriDeck)와 별개다. 계획: [docs/portal-plan.md](docs/portal-plan.md) — 단계마다 사용자 확인을 받는다.

## 구조

- `site/` 가 배포물 전부. 빌드 단계 없음 — 파일 그대로 Nginx 루트가 된다
- 설치 파일 · 버전 · 릴리스 노트 · 다운로드 수는 **GitHub Releases** 가 원본. 사이트에 버전을 하드코딩하지 않는다
- JS 는 ES 모듈, 프레임워크 없음. 화면과 무관한 로직은 `assets/js/lib.js`(순수 함수, `tests/` 로 검사), DOM 은 페이지별 파일
- 외부 주소(NoriHub · npm · GitHub)는 HTML 에 직접 있다. 바꿀 때는 `grep -rn tst.norihub.org site` 로 모두 고친다

## 규칙

1. 변경 후 `npm run check` (prettier + node --test)
2. GitHub 응답은 `textContent` 로만 넣는다 (`el()` 도우미). 예외는 릴리스 노트 하나: GitHub 이 렌더링한 `body_html` 을 `DOMPurify`(assets/vendor/purify.es.js, 버전은 파일 첫 줄)로 다시 정화한 뒤 넣는다
3. API 실패 시에도 페이지가 쓸모 있게: 다운로드 버튼은 `/download`, 다운로드 페이지는 GitHub Releases 링크를 보여 준다
4. 콘솔 사실관계는 콘솔 저장소 기준 (README · CLAUDE.md · keymap.ts). 콘솔이 바뀌면(기본 키 · 메뉴 · 파일 이름) 같이 고친다. 확인 안 된 기능·API 를 지어내지 않는다. Windows 1순위, Linux 준비 중, macOS 목표 아님
5. 문구는 한국어 · 영어 둘 다 (헤더 지구본 메뉴, localStorage `norideck.locale`, 기본 한국어). HTML 정적 문구는 한국어를 HTML 에 쓰고 `data-i18n`(글자) · `data-i18n-html`(우리가 쓴 HTML) · `data-i18n-attr`(`속성:키;…`)로 표시, 영어는 `assets/js/messages.js` 의 `staticEn`. JS 가 만드는 문구는 `dynamic.ko/en` + `t()` · `tParts()`. 릴리스 노트 본문은 번역하지 않는다. 키 누락은 `tests/i18n.test.mjs` 가 잡는다. 파일은 작게(300줄 넘으면 나눈다). 주석은 한국어, 식별자는 영어
6. 헤더는 `NoriDeck` 글자만, 푸터는 `© 연도 NGHSLab` 텍스트만, 파비콘은 배경 없는 콘솔 그림

## 커밋

Conventional Commits, scope 없이: `<type>: <English summary>` (50자 이내, 마침표 없음). 작성자 `hsnam11 <hs.nam@nghslab.org>`. 기능 하나 = 커밋 하나.
