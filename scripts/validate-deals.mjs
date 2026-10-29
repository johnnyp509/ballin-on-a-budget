#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dealsPath = resolve('data/deals.json');
const htmlPath = resolve('index.html');
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function extractFallback(html) {
  const marker = 'const BALLIN_FALLBACK_DEALS =';
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) throw new Error('Could not find BALLIN_FALLBACK_DEALS declaration');

  const start = html.indexOf('[', markerIndex + marker.length);
  if (start < 0) throw new Error('Could not find fallback array start');

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i += 1) {
    const char = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '[') depth += 1;
    else if (char === ']') {
      depth -= 1;
      if (depth === 0) return JSON.parse(html.slice(start, i + 1));
    }
  }
  throw new Error('Fallback array is unterminated');
}

let deals;
let fallback;
try {
  deals = JSON.parse(readFileSync(dealsPath, 'utf8'));
  fallback = extractFallback(readFileSync(htmlPath, 'utf8'));
} catch (error) {
  console.error(`FAIL: Unable to parse deal data: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(deals) || deals.length === 0) fail('data/deals.json must be a non-empty array');
if (!Array.isArray(fallback) || fallback.length === 0) fail('Embedded fallback must be a non-empty array');

const seen = new Set();
const requiredFields = ['id', 'business', 'city', 'category', 'deal', 'days', 'time', 'terms', 'source', 'verified', 'confidence', 'score'];
const today = new Date().toISOString().slice(0, 10);
let staleCount = 0;
let missingCoordinates = 0;

for (const [index, deal] of deals.entries()) {
  const label = `deal at index ${index}`;
  if (!deal || typeof deal !== 'object' || Array.isArray(deal)) {
    fail(`${label} must be an object`);
    continue;
  }

  for (const field of requiredFields) {
    if (deal[field] === undefined || deal[field] === null || deal[field] === '') {
      fail(`${label} (id ${deal.id ?? 'unknown'}) is missing required field "${field}"`);
    }
  }

  if (!Number.isInteger(deal.id)) fail(`${label} has a non-integer id`);
  else if (seen.has(deal.id)) fail(`Duplicate deal id: ${deal.id}`);
  else seen.add(deal.id);

  if (typeof deal.verified !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(deal.verified) ||
      Number.isNaN(Date.parse(`${deal.verified}T00:00:00Z`)) ||
      new Date(`${deal.verified}T00:00:00Z`).toISOString().slice(0, 10) !== deal.verified) {
    fail(`Deal id ${deal.id ?? 'unknown'} has an invalid verified date`);
  } else if (deal.verified > today) {
    fail(`Deal id ${deal.id} has a future verified date (${deal.verified})`);
  } else if ((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${deal.verified}T00:00:00Z`)) / 86400000 > 7) {
    staleCount += 1;
  }

  if (!Number.isFinite(deal.score)) fail(`Deal id ${deal.id ?? 'unknown'} has a non-numeric score`);

  const hasLat = deal.lat !== undefined && deal.lat !== null;
  const hasLng = deal.lng !== undefined && deal.lng !== null;
  if (hasLat !== hasLng) fail(`Deal id ${deal.id ?? 'unknown'} must have both lat and lng, or neither`);
  if (hasLat && (!Number.isFinite(deal.lat) || deal.lat < -90 || deal.lat > 90 ||
                 !Number.isFinite(deal.lng) || deal.lng < -180 || deal.lng > 180)) {
    fail(`Deal id ${deal.id ?? 'unknown'} has invalid coordinates`);
  }
  if (!hasLat && !hasLng) missingCoordinates += 1;
}

if (JSON.stringify(deals) !== JSON.stringify(fallback)) {
  fail('Embedded BALLIN_FALLBACK_DEALS does not exactly match data/deals.json');
}

if (missingCoordinates > 0) warnings.push(`${missingCoordinates} deal(s) have no coordinates and will not appear as map pins until geocoded`);
if (staleCount > 0) warnings.push(`${staleCount} deal(s) are older than the 7-day live-verification window`);

for (const warning of warnings) console.warn(`WARN: ${warning}`);
for (const error of errors) console.error(`FAIL: ${error}`);

if (errors.length > 0) process.exit(1);
console.log(`PASS: ${deals.length} deals, ${seen.size} unique IDs; fallback matches exactly.`);
if (warnings.length === 0) console.log('PASS: no stale records or missing coordinates found.');
