#!/usr/bin/env bash
# 사이트 업데이트 (deploy 계정으로 실행): 최신 코드를 받기만 하면 nginx 가 바로 새 파일을 내보낸다
#   su - deploy -c '/opt/norideck-portal/deploy/deploy.sh [브랜치]'
set -euo pipefail
cd "$(dirname "$0")/.."
branch="${1:-main}"

before=$(git rev-parse HEAD)
git fetch --quiet origin "$branch"
git checkout --quiet "$branch"
git reset --quiet --hard "origin/$branch"
after=$(git rev-parse HEAD)

# 새로 생긴 파일에도 SELinux 라벨을 붙인다 (deploy 계정은 restorecon 을 쓸 수 있다)
command -v restorecon >/dev/null && restorecon -R site 2>/dev/null || true

echo "배포: $(git log -1 --format='%h %s')"
if [ "$before" != "$after" ] && git diff --name-only "$before" "$after" | grep -q '^deploy/nginx/'; then
  echo "nginx 설정이 바뀌었습니다 → root 로 다시 적용: sudo bash $(pwd)/deploy/install.sh" >&2
fi
curl -fsS -o /dev/null http://127.0.0.1:8080/ || echo "응답 확인 실패 — sudo systemctl status nginx" >&2
