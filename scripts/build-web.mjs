#!/usr/bin/env node
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const output = resolve(root, 'www');
const requiredFiles = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'data/deals.json',
  'assets/logo.svg'
];

for (const relativePath of requiredFiles) {
  const filePath = resolve(root, relativePath);
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('not a file');
  } catch {
    throw new Error(`Required mobile web asset is missing: ${relativePath}`);
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const relativePath of requiredFiles.slice(0, 4)) {
  const destination = resolve(output, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(root, relativePath), destination);
}

const iconDir = resolve(output, 'icons');
await mkdir(iconDir, { recursive: true });
const logo = resolve(root, 'assets/logo.svg');

for (const size of [192, 512]) {
  await sharp(logo)
    .resize(size, size, { fit: 'contain' })
    .png()
    .toFile(resolve(iconDir, `icon-${size}.png`));
}

console.log('PASS: built web bundle and generated 192px/512px PWA icons from assets/logo.svg.');
