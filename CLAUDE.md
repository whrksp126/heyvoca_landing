# CLAUDE.md — heyvoca_landing

헤이보카 홍보 사이트. Astro SSG + Tailwind. 정적 nginx 컨테이너로 배포.

## 핵심 명령어

```bash
npm install && npm run dev    # 로컬 개발 (http://localhost:4321)
npm run build                  # dist/ 생성
docker build -t heyvoca_landing:test . && docker run --rm -p 8080:80 heyvoca_landing:test
./deploy.sh                    # 서버 배포 (SSH → git pull → 재빌드)
```

## 디자인

- 메인 핑크 #FF70D4 (`primary-600`), 팔레트는 `tailwind.config.mjs` 참고
- 폰트: Pretendard Variable (CDN 임포트, `src/styles/global.css`)
- 자산: `public/images/` (heyvoca_front에서 복사한 로고/캐릭터)

## SEO

- `BaseLayout.astro` — 페이지별 title/description, OG, Twitter Card, JSON-LD(Organization, MobileApplication)
- `astro.config.mjs` — `site: 'https://heyvoca.ghmate.com'`, `@astrojs/sitemap` 자동 생성
- `nginx.conf` — `/privacy_policy.html` ↔ `/privacy-policy.html` 매핑 (Google OAuth 동의 화면 호환)

## 배포 흐름

1. 로컬에서 변경 → git push
2. 서버: `./deploy.sh` (SSH → git pull → docker compose up --build)
3. 글로벌 nginx_proxy 컨테이너에 `heyvoca.ghmate.com → heyvoca_landing:80` 라우팅 (서버 `/srv/nginx-proxy/conf.d/heyvoca.conf`)

## 약관 갱신

- `src/pages/privacy-policy.astro`, `src/pages/terms-of-service.astro` 직접 편집
- `effectiveDate`, `lastUpdated`, 부칙 시행일 갱신 필수
- 시행일 변경 시 적용일 7일 전(불리한 변경은 30일 전) 사전 공지 의무 명시되어 있음

## 절대 하면 안 되는 것

- 사업자등록번호 등 회사 정보를 직접 코드에 하드코딩한 부분 변경 시 약관/푸터 양쪽 모두 갱신 필수
- `.env*` 파일 추가 금지 (정적 사이트라 환경변수 불필요)
