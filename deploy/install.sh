#!/usr/bin/env bash
# Rocky Linux 8 에 포털을 처음 설치하거나 nginx 설정을 다시 적용한다 (root 로 실행, 여러 번 실행해도 된다)
#   curl/clone 후:  sudo bash /opt/norideck-portal/deploy/install.sh
# 하는 일: nginx 1.24 설치 · deploy 계정 · /opt/norideck-portal 코드 · SELinux · 방화벽 · nginx 설정 복사 · 시작
set -euo pipefail

APP_DIR=/opt/norideck-portal
REPO_URL=${REPO_URL:-https://github.com/NGHSLab/NoriDeck-Portal.git}
BRANCH=${BRANCH:-main}
PORT=${PORT:-8080}
L7_IP=${L7_IP:-}          # 예) L7_IP=10.0.0.5 → 8080 은 이 IP 에서만 열림. 비우면 방화벽은 건드리지 않음

[ "$(id -u)" -eq 0 ] || { echo "root 로 실행하세요 (sudo)" >&2; exit 1; }

echo "== 패키지"
dnf -y module reset nginx >/dev/null
dnf -y module enable nginx:1.24 >/dev/null
dnf -y install nginx git policycoreutils-python-utils >/dev/null
nginx -v

echo "== 배포 계정 · 코드"
id deploy >/dev/null 2>&1 || useradd -m deploy
if [ ! -d "$APP_DIR/.git" ]; then
  install -d -o deploy -g deploy -m 755 "$APP_DIR"
  # 저장소가 비공개면 먼저 deploy 계정에 PAT 를 저장해 둔다 (deploy/README.md)
  sudo -u deploy git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
chmod 755 "$APP_DIR"

echo "== SELinux"
if command -v getenforce >/dev/null && [ "$(getenforce)" != "Disabled" ]; then
  semanage fcontext -a -t httpd_sys_content_t "$APP_DIR/site(/.*)?" 2>/dev/null \
    || semanage fcontext -m -t httpd_sys_content_t "$APP_DIR/site(/.*)?"
  restorecon -R "$APP_DIR/site"
  # 8080 은 기본으로 http_cache_port_t 라 nginx 가 열 수 있게 http_port_t 로 바꾼다
  semanage port -a -t http_port_t -p tcp "$PORT" 2>/dev/null \
    || semanage port -m -t http_port_t -p tcp "$PORT"
fi

echo "== 방화벽"
if [ -n "$L7_IP" ] && systemctl is-active --quiet firewalld; then
  firewall-cmd -q --permanent --add-rich-rule="rule family=ipv4 source address=$L7_IP port port=$PORT protocol=tcp accept" || true
  firewall-cmd -q --reload
  echo "$PORT/tcp ← $L7_IP 허용"
else
  echo "건너뜀 (L7_IP 미지정 또는 firewalld 꺼짐)"
fi

echo "== nginx 설정"
install -m 644 "$APP_DIR/deploy/nginx/norideck-portal.conf" /etc/nginx/conf.d/norideck-portal.conf
install -m 644 "$APP_DIR/deploy/nginx/norideck-portal-headers.inc" /etc/nginx/norideck-portal-headers.inc
if [ "$PORT" != "8080" ]; then
  sed -i "s/listen 8080 /listen $PORT /; s/listen \[::\]:8080 /listen [::]:$PORT /" /etc/nginx/conf.d/norideck-portal.conf
fi
nginx -t
systemctl enable --now nginx >/dev/null
systemctl reload nginx

curl -fsS -o /dev/null "http://127.0.0.1:$PORT/" && echo "완료: http://<VM_IP>:$PORT/ ($(sudo -u deploy git -C "$APP_DIR" log -1 --format='%h %s'))"
