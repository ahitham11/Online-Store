import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function encodePng(size, pixels) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    pixels.copy(row, 1, y * size * 4, (y + 1) * size * 4);
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const mix = (a, b, t) => a + (b - a) * t;

function mixColor(a, b, t) {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

function hex(value) {
  const clean = value.replace('#', '');
  const int = parseInt(clean, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const lengthSq = vx * vx + vy * vy;
  const t = lengthSq === 0 ? 0 : clamp((wx * vx + wy * vy) / lengthSq);
  const dx = px - (ax + vx * t);
  const dy = py - (ay + vy * t);
  return Math.hypot(dx, dy);
}

function circleAlpha(px, py, cx, cy, radius, width) {
  const distance = Math.abs(Math.hypot(px - cx, py - cy) - radius);
  return clamp(width * 0.5 + 0.85 - distance);
}

function lineAlpha(px, py, ax, ay, bx, by, width) {
  const distance = segmentDistance(px, py, ax, ay, bx, by);
  return clamp(width * 0.5 + 0.85 - distance);
}

function arcAlpha(px, py, cx, cy, radius, width, fromAngle, toAngle) {
  const dx = px - cx;
  const dy = py - cy;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += Math.PI * 2;
  let start = fromAngle;
  let end = toAngle;
  if (start < 0) start += Math.PI * 2;
  if (end < 0) end += Math.PI * 2;
  if (start > end) [start, end] = [end, start];
  if (angle < start || angle > end) return 0;
  return circleAlpha(px, py, cx, cy, radius, width);
}

const AUBERGINE_DEEP = hex('#160A13');
const AUBERGINE = hex('#2B1026');
const AUBERGINE_SOFT = hex('#3A1732');
const CHAMPAGNE = hex('#C9A57A');
const CHAMPAGNE_LIGHT = hex('#E9D6BA');
const PEARL = hex('#FBF6F1');
const ROSE = hex('#A8476E');

function createBrandPng(size, { background = false, monogramScale = 1 } = {}) {
  const pixels = Buffer.alloc(size * size * 4);
  const sub = 2;
  const step = 1 / (sub * sub);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < sub; sy++) {
        for (let sx = 0; sx < sub; sx++) {
          const px = (x + (sx + 0.5) / sub) / size;
          const py = (y + (sy + 0.5) / sub) / size;
          const cx = px - 0.5;
          const cy = py - 0.5;
          const radius = Math.hypot(cx, cy);

          let color = [0, 0, 0];
          let alpha = 0;

          if (background) {
            const glow = Math.max(0, 1 - radius * 1.55);
            color = mixColor(AUBERGINE_DEEP, AUBERGINE_SOFT, glow * 0.92);
            color = mixColor(color, ROSE, Math.max(0, 0.16 - radius * 0.24));
            alpha = 1;
          }

          const scale = monogramScale;
          const ringRadius = 0.36 * scale;
          const innerRadius = 0.322 * scale;
          const outerRing = circleAlpha(px, py, 0.5, 0.5, ringRadius, 0.0028 * size * scale);
          const innerRing = circleAlpha(px, py, 0.5, 0.5, innerRadius, 0.0013 * size * scale);

          if (outerRing > 0) {
            color = mixColor(color, CHAMPAGNE, outerRing);
            alpha = Math.max(alpha, outerRing * (background ? 1 : 1));
          }
          if (innerRing > 0) {
            color = mixColor(color, CHAMPAGNE, innerRing * 0.62);
            alpha = Math.max(alpha, innerRing * 0.7);
          }

          // The V is drawn as two bevelled strokes, mirroring the wordmark.
          const topY = 0.5 - 0.17 * scale;
          const bottomY = 0.5 + 0.185 * scale;
          const leftX = 0.5 - 0.175 * scale;
          const rightX = 0.5 + 0.175 * scale;
          const stroke = 0.011 * size * scale;

          const left = lineAlpha(px, py, leftX, topY, 0.5, bottomY, stroke);
          const right = lineAlpha(px, py, rightX, topY, 0.5, bottomY, stroke);
          const vAlpha = Math.max(left, right);
          if (vAlpha > 0) {
            color = mixColor(color, PEARL, vAlpha);
            alpha = Math.max(alpha, vAlpha);
          }

          // A shallow champagne smile cradles the V, as on the lockup.
          const smile = arcAlpha(
            px,
            py,
            0.5,
            0.5 - 0.085 * scale,
            0.118 * scale,
            0.0032 * size * scale,
            0.22,
            Math.PI - 0.22,
          );
          if (smile > 0) {
            color = mixColor(color, CHAMPAGNE_LIGHT, smile * 0.9);
            alpha = Math.max(alpha, smile * 0.9);
          }

          const dot = circleAlpha(px, py, 0.5, 0.5 + 0.252 * scale, 0.0105 * scale, 0.0015 * size);
          if (dot > 0) {
            color = mixColor(color, CHAMPAGNE, dot);
            alpha = Math.max(alpha, dot);
          }

          r += color[0] * alpha * step;
          g += color[1] * alpha * step;
          b += color[2] * alpha * step;
          a += alpha * step;
        }
      }

      const offset = (y * size + x) * 4;
      const safeAlpha = a > 0 ? a : 1;
      pixels[offset] = Math.round(clamp(r / safeAlpha, 0, 255));
      pixels[offset + 1] = Math.round(clamp(g / safeAlpha, 0, 255));
      pixels[offset + 2] = Math.round(clamp(b / safeAlpha, 0, 255));
      pixels[offset + 3] = Math.round(clamp(a) * 255);
    }
  }

  return encodePng(size, pixels);
}

const outputDir = resolve(root, 'assets/images');
mkdirSync(outputDir, { recursive: true });

const outputs = [
  { name: 'icon.png', data: createBrandPng(1024, { background: true, monogramScale: 1 }) },
  {
    name: 'adaptive-icon.png',
    data: createBrandPng(1024, { background: false, monogramScale: 0.72 }),
  },
  {
    name: 'splash-icon.png',
    data: createBrandPng(512, { background: false, monogramScale: 0.92 }),
  },
  { name: 'favicon.png', data: createBrandPng(64, { background: true, monogramScale: 1 }) },
];

for (const { name, data } of outputs) {
  const target = resolve(outputDir, name);
  writeFileSync(target, data);
  console.log(`Wrote ${target} (${data.length} bytes)`);
}
