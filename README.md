# heyvoca_landing

헤이보카(Hey, Voca!) 홍보용 랜딩 사이트 + 개인정보처리방침 / 서비스 이용약관 페이지.

배포 도메인: https://heyvoca.ghmate.com

## 기술 스택

- **Astro 5** — 정적 사이트 생성(SSG), SEO 최적화
- **Tailwind CSS 3** — heyvoca 핑크 팔레트 적용
- **Pretendard Variable** — 한글 본문 폰트
- **nginx (1.27-alpine)** — 정적 파일 서빙
- **Docker** — 멀티스테이지 빌드 → nginx 컨테이너

## 페이지

| URL | 설명 |
|-----|------|
| `/` | 랜딩 (히어로 / 특장점 / 다운로드 CTA) |
| `/privacy-policy` | 개인정보처리방침 |
| `/privacy_policy.html` | (Google OAuth 호환) → 위와 동일 |
| `/terms-of-service` | 서비스 이용약관 |
| `/terms_of_service.html` | (Google OAuth 호환) → 위와 동일 |
| `/sitemap-index.xml` | 자동 생성 사이트맵 |
| `/robots.txt` | 크롤러 허용 |

## 로컬 개발

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # dist/ 정적 파일 생성
npm run preview      # 빌드 미리보기
```

## 도커 빌드 검증

```bash
docker build -t heyvoca_landing:test .
docker run --rm -p 8080:80 heyvoca_landing:test
# → http://localhost:8080
```

## 서버 배포

```bash
./deploy.sh
```

내부 동작: SSH → `cd /srv/projects/heyvoca_landing` → `git pull` → `docker compose -p heyvoca_landing up --build -d` → `nginx_proxy` reload.

## 글로벌 nginx 라우팅

서버의 `/srv/nginx-proxy/conf.d/heyvoca.conf` 에 아래 server 블록이 있어야 함:

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name heyvoca.ghmate.com;
    ssl_certificate /etc/nginx/certs/cloudflare_chain.crt;
    ssl_certificate_key /etc/nginx/certs/cloudflare.key;
    location / {
        proxy_pass http://heyvoca_landing:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 사업자 정보

- 상호: 슬기로운 사업
- 대표: 조건호
- 사업자등록번호: 315-27-01645
- 이메일: ceo@ghmate.com
