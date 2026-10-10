# 배포 (Rocky Linux 8 · dnf nginx)

포털은 정적 파일(`site/`)뿐이라 **OS 패키지 nginx** 로 바로 서빙한다. Docker · Java · DB 가 필요 없다.
설치 파일은 이 서버에 두지 않는다 — 방문자 브라우저가 GitHub Releases(NGHSLab/NoriDeck)에서 정보를 읽고 파일도 GitHub 에서 받는다.

```
L7 스위치 (HTTPS, 도메인) ──HTTP──▶ VM:8080  nginx ──▶ /opt/norideck-portal/site
```

| 파일                                | 역할                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `install.sh`                        | root 로 처음 한 번 (설정이 바뀌면 다시): nginx 1.24 · deploy 계정 · 코드 clone · SELinux · 방화벽 · 설정 복사 · 시작 |
| `deploy.sh`                         | deploy 계정으로: `git pull` 만 하면 끝 (nginx 재시작 불필요)                                                         |
| `nginx/norideck-portal.conf`        | → `/etc/nginx/conf.d/norideck-portal.conf` (server 블록, :8080)                                                      |
| `nginx/norideck-portal-headers.inc` | → `/etc/nginx/norideck-portal-headers.inc` (CSP 등 보안 헤더)                                                        |

## 처음 설치

```bash
# root
dnf -y install git
git clone https://github.com/NGHSLab/NoriDeck-Portal.git /tmp/norideck-portal
L7_IP=<L7 스위치 IP> bash /tmp/norideck-portal/deploy/install.sh
rm -rf /tmp/norideck-portal
```

- `install.sh` 가 `/opt/norideck-portal` 에 deploy 계정 소유로 다시 clone 하고, 끝에 `http://127.0.0.1:8080/` 응답을 확인한다
- 옵션 환경 변수: `PORT`(기본 8080 — 같은 VM 에서 다른 서비스가 8080 을 쓰면 8090 등으로), `BRANCH`(기본 main), `L7_IP`(지정하면 그 IP 에서만 포트 허용)
- 저장소가 **비공개**면 clone 전에 PAT 가 필요하다: deploy 계정에 `git config --global credential.helper store` 후 한 번 `git clone` 해서 저장하거나, root 의 첫 clone 은 `https://<PAT>@github.com/...` 로

## L7 스위치

| 항목      | 값                                                                      |
| --------- | ----------------------------------------------------------------------- |
| 대상      | VM_IP:8080 (HTTP)                                                       |
| 헬스 체크 | `GET /` → 200                                                           |
| 도메인    | 테스트 예) `tst.norideck.org` → 운영 `norideck.org` (www 는 루트로 301) |

업로드가 없으므로 본문 크기 · 긴 타임아웃 설정은 필요 없다. nginx 는 리다이렉트를 상대 주소로 보내므로(`absolute_redirect off`) HTTPS 앞단 뒤에서도 주소가 깨지지 않는다.

## 업데이트

```bash
su - deploy -c '/opt/norideck-portal/deploy/deploy.sh'      # 사이트 파일만 바뀐 경우 이것으로 끝
sudo bash /opt/norideck-portal/deploy/install.sh            # deploy/nginx/ 가 바뀌었다고 알려 주면
```

## 확인 · 문제 해결

```bash
curl -I http://127.0.0.1:8080/            # 200 + Content-Security-Policy
sudo tail -f /var/log/nginx/norideck-portal.access.log
sudo nginx -t && sudo systemctl status nginx
```

- `403 Forbidden` → SELinux 라벨: `sudo restorecon -R /opt/norideck-portal/site` (설치 스크립트가 `httpd_sys_content_t` 로 등록해 둠)
- nginx 가 8080 을 못 연다(`bind() ... Permission denied`) → `sudo semanage port -m -t http_port_t -p tcp 8080`
- 다운로드 표가 "불러오지 못했습니다" → NoriDeck 저장소가 비공개이거나 GitHub API 한도(방문자 IP 당 시간 60회, 탭 기준 10분 캐시로 완화)
- Rocky 기본 nginx 설정의 :80 server 블록은 그대로 둔다 (L7 은 8080 만 본다). 쓰지 않으면 `/etc/nginx/nginx.conf` 의 기본 server 를 지워도 된다

## 다른 방법

- **Docker** 를 이미 쓰는 VM 이라면 `nginx:alpine` 컨테이너에 `site/` 를 읽기 전용으로 붙여도 된다 (이 nginx 설정을 그대로 사용)
- **GitHub Pages · Cloudflare Pages** 에 `site/` 를 그대로 올려도 동작한다 (비공개 저장소의 GitHub Pages 는 유료). 보안 헤더는 그 서비스 설정으로
