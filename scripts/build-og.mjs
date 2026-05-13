// 빌드 시 OG 이미지를 satori로 생성한다.
// 결과물은 public/og-image.png (1200x630).
// 카피·디자인 변경 시 이 파일만 수정하고 `npm run build` 또는 `node scripts/build-og.mjs` 재실행.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const OUT = path.join(ROOT, 'public', 'og-image.png');
const FONT_CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'og-fonts');
const FONT_URLS = {
  // Pretendard static OTF (satori는 OTF/TTF/WOFF 지원, woff2는 미지원)
  bold:    'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Bold.woff',
  black:   'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Black.woff',
  regular: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Regular.woff',
};

async function loadFont(name, url) {
  fs.mkdirSync(FONT_CACHE_DIR, { recursive: true });
  const cachePath = path.join(FONT_CACHE_DIR, `${name}.woff`);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
  }
  console.log(`[og] fetching font: ${name}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed (${name}): ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cachePath, buf);
  return buf;
}

function readImageAsDataUrl(relPath) {
  const buf = fs.readFileSync(path.join(ROOT, relPath));
  const ext = path.extname(relPath).slice(1).toLowerCase();
  return `data:image/${ext};base64,${buf.toString('base64')}`;
}

async function main() {
  const [regular, bold, black] = await Promise.all([
    loadFont('regular', FONT_URLS.regular),
    loadFont('bold', FONT_URLS.bold),
    loadFont('black', FONT_URLS.black),
  ]);

  const heyCharacter = readImageAsDataUrl('public/images/HeyCharacter.png');
  const logo = readImageAsDataUrl('public/images/logo_h.png');

  const tree = {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        backgroundColor: '#F7F7F7',
        padding: '72px 80px',
        position: 'relative',
        fontFamily: 'Pretendard',
      },
      children: [
        // 좌측: 카피 + 로고
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: 720,
              height: '100%',
            },
            children: [
              // eyebrow
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: '#8A8A8A',
                    fontSize: 18,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF70D4' },
                      },
                    },
                    { type: 'div', props: { children: 'HEY, VOCA · iOS · ANDROID · WEB' } },
                  ],
                },
              },
              // H1
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: 76,
                    fontWeight: 900,
                    color: '#0A0A0A',
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                  },
                  children: [
                    { type: 'div', props: { children: '그냥 외우세요.' } },
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex' },
                        children: [
                          { type: 'span', props: { children: '나머진 ' } },
                          { type: 'span', props: { style: { color: '#FF70D4' }, children: '헤이보카' } },
                          { type: 'span', props: { children: '가' } },
                        ],
                      },
                    },
                    { type: 'div', props: { children: '알아서 합니다.' } },
                  ],
                },
              },
              // 푸터: 로고 + URL
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 16 },
                  children: [
                    { type: 'img', props: { src: logo, height: 28, style: { objectFit: 'contain' } } },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 20, color: '#5C5C5C', fontWeight: 500 },
                        children: 'heyvoca.ghmate.com',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // 우측: 마스코트
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            },
            children: [
              {
                type: 'img',
                props: {
                  src: heyCharacter,
                  height: 460,
                  style: { objectFit: 'contain' },
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(tree, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Pretendard', data: regular, weight: 400, style: 'normal' },
      { name: 'Pretendard', data: bold, weight: 700, style: 'normal' },
      { name: 'Pretendard', data: black, weight: 900, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const rawPng = resvg.render().asPng();
  // 색감 보존하면서 압축 (sharp palette + 최대 compressionLevel)
  const png = await sharp(rawPng)
    .png({ palette: true, compressionLevel: 9, quality: 90, effort: 10 })
    .toBuffer();
  fs.writeFileSync(OUT, png);
  console.log(`[og] wrote ${OUT} (raw ${(rawPng.length / 1024).toFixed(1)} KB → ${(png.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('[og] failed:', err);
  process.exit(1);
});
