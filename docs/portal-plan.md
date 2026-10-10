# NoriDeck Portal 계획

## 단계

- [x] 0. 알파 뼈대 (2026-10-04) — React + Spring Boot + MySQL, 관리자 업로드 (기록용, 1단계에서 걷어냄)
- [x] **1. 정적 사이트 전환** (2026-10-10) — 업로드·DB 없이 콘솔 소개 + 설치 안내. 설치 파일·다운로드 수는 GitHub Releases
- [ ] 2. 테스트 서버 배포 — 도메인(tst.norideck.org 등) 결정, deploy/README.md 순서대로, NoriDeck 저장소 공개
- [ ] 3. 운영 — norideck.org, NoriHub 링크를 norihub.org 로
- [ ] 4. 다국어(en)

## 결정

| 항목                    | 결정                                                            |
| ----------------------- | --------------------------------------------------------------- |
| 사이트                  | 정적 (HTML · CSS · ES 모듈 JS), 빌드 없음                       |
| 설치 파일 · 다운로드 수 | GitHub Releases (NGHSLab/NoriDeck)                              |
| 배포                    | Rocky Linux 8 · dnf nginx 1.24 (Docker 없음), 앞단 L7 → VM:8080 |
| NoriHub 링크            | 테스트 서버 https://tst.norihub.org                             |

## 열린 질문

- 포털 테스트 도메인
- 다운로드 수 추이를 남길지 (`npm run stats -- --csv` 를 GitHub Actions 로 매일 기록)
- 콘솔 자동 업데이트(electron-updater)도 같은 GitHub Releases 를 볼지 — 콘솔 3단계에서 결정
