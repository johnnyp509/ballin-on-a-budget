#!/usr/bin/env node
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'www');
const requiredFiles = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'data/deals.json'
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

for (const relativePath of requiredFiles) {
  await cp(resolve(root, relativePath), resolve(output, relativePath));
}

console.log('PASS: copied app shell, manifest, service worker, and canonical deal data into www/.');
