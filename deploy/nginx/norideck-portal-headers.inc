# 공통 보안 헤더. 다운로드 정보는 브라우저가 api.github.com 에서 직접 가져온다 # 릴리스 노트에 넣은 이미지는 github.com
· *.githubusercontent.com 에서 온다 # (location 안에서 add_header 를 쓰면 위 헤더가 상속되지 않으므로 그곳에서도 이
파일을 include 한다) add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://api.github.com;
img-src 'self' data: https://github.com https://*.githubusercontent.com; style-src 'self' 'unsafe-inline'
https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; frame-ancestors 'none'; base-uri
'self'" always; add_header X-Content-Type-Options "nosniff" always; add_header Referrer-Policy
"strict-origin-when-cross-origin" always;
