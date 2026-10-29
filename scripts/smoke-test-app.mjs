#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const deals = JSON.parse(readFileSync('data/deals.json', 'utf8'));

// Compile every inline JavaScript block without executing browser-only code.
const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attributes, body]) => !/\bsrc\s*=/.test(attributes) && body.trim());
assert.ok(inlineScripts.length > 0, 'Expected inline JavaScript in index.html');
for (const [index, match] of inlineScripts.entries()) {
  new vm.Script(match[2], { filename: `index.html:inline-script-${index + 1}` });
}

// Exercise the real day/time helpers from index.html with representative cases.
const dayMatchesSource = html.match(/function dayMatches\(days, day\)\s*\{[\s\S]*?\n\}/);
const minutesFromTimeSource = html.match(/function minutesFromTime\(t\)\s*\{[^\n]*\}/);
assert.ok(dayMatchesSource, 'dayMatches helper must exist');
assert.ok(minutesFromTimeSource, 'minutesFromTime helper must exist');

const helpers = vm.runInNewContext(
  `${dayMatchesSource[0]}\n${minutesFromTimeSource[0]}\n({ dayMatches, minutesFromTime })`
);

assert.equal(helpers.dayMatches('Monday-Friday', 1), true, 'weekday range includes Monday');
assert.equal(helpers.dayMatches('Monday-Friday', 5), true, 'weekday range includes Friday');
assert.equal(helpers.dayMatches('Monday-Friday', 0), false, 'weekday range excludes Sunday');
assert.equal(helpers.dayMatches('Fri-Sun', 0), true, 'range wraps across Sunday');
assert.equal(helpers.dayMatches('Daily', 6), true, 'daily schedule includes Saturday');
assert.equal(helpers.dayMatches('Weekends', 6), true, 'weekends includes Saturday');
assert.equal(helpers.dayMatches('Weekends', 2), false, 'weekends excludes Tuesday');

assert.equal(helpers.minutesFromTime('3 PM'), 900, '3 PM converts to 15:00');
assert.equal(helpers.minutesFromTime('9:30 pm'), 1290, '9:30 PM converts to 21:30');
assert.equal(helpers.minutesFromTime('12 AM'), 0, '12 AM converts to midnight');
assert.equal(helpers.minutesFromTime('12 PM'), 720, '12 PM converts to noon');
assert.equal(helpers.minutesFromTime('invalid'), null, 'unrecognized time returns null');

// Ensure the app's key browsing paths remain present in the page source.
for (const name of ['filteredDeals', 'renderDeals', 'renderMap', 'nearbyDeals', 'isHappeningNow']) {
  assert.match(html, new RegExp(`function ${name}\\(`), `${name} should remain defined`);
}
assert.ok(html.includes('BALLIN_FALLBACK_DEALS'), 'embedded fallback should remain present');
assert.ok(deals.length > 0, 'canonical deal data should not be empty');

const milesBetweenSource = html.match(/function milesBetween\(lat1,lon1,lat2,lon2\)\s*\{[^\n]*\}/);
const locationCenterSource = html.match(/function locationCenter\(\)\s*\{[^\n]*\}/);
const nearbyDealsSource = html.match(/function nearbyDeals\(\)\s*\{[^\n]*\}/);
assert.ok(milesBetweenSource && locationCenterSource && nearbyDealsSource, 'map distance helpers must exist');

const mapHelpers = vm.runInNewContext(
  `const deals = ${JSON.stringify(deals)}; let userLocation = 'Gilbert', userRadius = 10;
  ${milesBetweenSource[0]}\n${locationCenterSource[0]}\n${nearbyDealsSource[0]}
  ({ nearbyDeals, setRadius(value) { userRadius = value; } })`
);
const tenMileDeals = mapHelpers.nearbyDeals();
assert.ok(tenMileDeals.some(deal => deal.id === 326), 'Hop Social Grill should be mappable within 10 miles of Gilbert');
for (const id of [333, 334, 335, 336, 337, 338]) {
  assert.ok(tenMileDeals.some(deal => deal.id === id), `Four Silos deal ${id} should be mappable within 10 miles of Gilbert`);
}
assert.ok(!tenMileDeals.some(deal => [375, 376, 377, 378].includes(deal.id)), 'deals without coordinates should not create map pins');
assert.ok(tenMileDeals.every(deal => Number.isFinite(deal.lat) && Number.isFinite(deal.lng) && deal.distance <= 10), 'map results must have coordinates and respect the radius');
mapHelpers.setRadius(2);
assert.ok(mapHelpers.nearbyDeals().every(deal => deal.distance <= 2), 'a smaller radius must exclude distant pins');

console.log(`PASS: ${inlineScripts.length} inline scripts parse; schedule and map-radius tests pass; core search/map functions exist.`);
