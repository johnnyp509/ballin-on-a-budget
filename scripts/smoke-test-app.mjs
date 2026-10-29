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

const timeWindowsSource = html.match(/function timeWindows\(value\)\s*\{[\s\S]*?\n\}/);
const isHappeningNowSource = html.match(/function isHappeningNow\(d\)\s*\{[\s\S]*?\n\}/);
const startsSoonSource = html.match(/function startsSoon\(d\)\s*\{[\s\S]*?\n\}/);
const minutesRemainingSource = html.match(/function minutesRemaining\(d\)\s*\{[\s\S]*?\n\}/);
const isTonightSource = html.match(/function isTonight\(d\)\s*\{[\s\S]*?\n\}/);
const currentEndLabelSource = html.match(/function currentEndLabel\(d\)\s*\{[\s\S]*?\n\}/);
const startsSoonLabelSource = html.match(/function startsSoonLabel\(d\)\s*\{[\s\S]*?\n\}/);
const tonightLabelSource = html.match(/function tonightLabel\(d\)\s*\{[\s\S]*?\n\}/);
assert.ok([timeWindowsSource,isHappeningNowSource,startsSoonSource,minutesRemainingSource,isTonightSource,currentEndLabelSource,startsSoonLabelSource,tonightLabelSource].every(Boolean), 'multi-window schedule helpers must exist');

function scheduleAt(isoTime) {
  const fixed = Date.parse(isoTime);
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [fixed])); }
    static now() { return fixed; }
  }
  const source = [
    'function isFreshForLive(){ return true; }',
    dayMatchesSource[0], minutesFromTimeSource[0], timeWindowsSource[0],
    isHappeningNowSource[0], startsSoonSource[0], minutesRemainingSource[0],
    isTonightSource[0], currentEndLabelSource[0], startsSoonLabelSource[0],
    tonightLabelSource[0],
    '({ timeWindows, isHappeningNow, startsSoon, minutesRemaining, isTonight, currentEndLabel, startsSoonLabel, tonightLabel })'
  ].join('\n');
  return vm.runInNewContext(source, { Date: FixedDate });
}

const twoWindowDeal = { days: 'Daily', time: '3 PM-6 PM; 9 PM-close', verified: '2026-10-26' };
const atFour = scheduleAt('2026-10-29T16:00:00Z');
assert.equal(atFour.isHappeningNow(twoWindowDeal), true, 'first daily window should be live at 4 PM');
assert.equal(atFour.minutesRemaining(twoWindowDeal), 120, 'ending-soon logic should use the active first window, not the later close window');
assert.match(atFour.currentEndLabel(twoWindowDeal), /ENDS IN 2 HRS/);

const atEight = scheduleAt('2026-10-29T20:00:00Z');
assert.equal(atEight.isHappeningNow(twoWindowDeal), false, 'gap between happy-hour windows should not be live');
assert.equal(atEight.startsSoon(twoWindowDeal), true, 'second daily window should count as starting soon');
assert.equal(atEight.isTonight(twoWindowDeal), true, 'second daily window should appear in tonight filter');
assert.match(atEight.startsSoonLabel(twoWindowDeal), /STARTS IN 1 HR/);
assert.match(atEight.tonightLabel(twoWindowDeal), /STARTS AT 9 PM/);

const atNineThirty = scheduleAt('2026-10-29T21:30:00Z');
assert.equal(atNineThirty.isHappeningNow(twoWindowDeal), true, 'second daily window should be live at 9:30 PM');
assert.equal(atNineThirty.minutesRemaining(twoWindowDeal), Infinity, 'a close-ending window should not show a false countdown');
assert.match(atNineThirty.currentEndLabel(twoWindowDeal), /UNTIL CLOSE/);
assert.equal(JSON.stringify(atNineThirty.timeWindows(twoWindowDeal.time).map(w => [w.start,w.end,w.close])), JSON.stringify([[900,1080,false],[1260,1439,true]]));

// Ensure the app's key browsing paths remain present in the page source.
for (const name of ['filteredDeals', 'renderDeals', 'renderMap', 'nearbyDeals', 'isHappeningNow']) {
  assert.match(html, new RegExp(`function ${name}\\(`), `${name} should remain defined`);
}
assert.ok(html.includes('BALLIN_FALLBACK_DEALS'), 'embedded fallback should remain present');
assert.ok(deals.length > 0, 'canonical deal data should not be empty');

const matchesSearchSource = html.match(/function matchesDealSearch\\(d,q\\)\\s*\\{[\\s\\S]*?\\n\\}/);
const matchesCategorySource = html.match(/function matchesDealCategory\\(d,selected\\)\\s*\\{[\\s\\S]*?\\n\\}/);
assert.ok(matchesSearchSource && matchesCategorySource, 'search and category filter helpers must exist');
const filters = vm.runInNewContext([
  'const saved = new Set([333]);',
  'function isHappeningNow(d){ return d.id === 333; }',
  'function minutesRemaining(){ return 30; }',
  'function startsSoon(d){ return d.id === 334; }',
  'function isTonight(d){ return d.id === 334; }',
  matchesSearchSource[0], matchesCategorySource[0],
  '({ matchesDealSearch, matchesDealCategory })'
].join('\\n'));
const searchableDeal = { id:333, business:'Four Silos Craft Coffee & Beer House', city:'Gilbert', category:'Food', deal:'$2 Off Cheese Pizza', days:'Daily', terms:'Daily happy-hour discount' };
assert.equal(filters.matchesDealSearch(searchableDeal, 'cheese pizza'), true, 'search should find deal terms');
assert.equal(filters.matchesDealSearch(searchableDeal, 'FOUR SILOS'), true, 'search should be case-insensitive');
assert.equal(filters.matchesDealSearch(searchableDeal, 'Gilbert'), true, 'search should include city');
assert.equal(filters.matchesDealSearch(searchableDeal, 'unrelated phrase'), false, 'search should exclude non-matches');
assert.equal(filters.matchesDealSearch(searchableDeal, ''), true, 'empty search should preserve all deals');
assert.equal(filters.matchesDealCategory(searchableDeal, 'ALL'), true, 'ALL category should preserve deal');
assert.equal(filters.matchesDealCategory(searchableDeal, 'Food'), true, 'matching category should include deal');
assert.equal(filters.matchesDealCategory(searchableDeal, 'Drinks'), false, 'different category should exclude deal');
assert.equal(filters.matchesDealCategory(searchableDeal, 'SAVED'), true, 'saved filter should include saved deals');
assert.equal(filters.matchesDealCategory({ ...searchableDeal, id:334 }, 'SAVED'), false, 'saved filter should exclude unsaved deals');
assert.equal(filters.matchesDealCategory(searchableDeal, 'LIVE'), true, 'live filter should use live status');
assert.equal(filters.matchesDealCategory(searchableDeal, 'ENDING'), true, 'ending-soon filter should use live status and remaining minutes');
assert.equal(filters.matchesDealCategory({ ...searchableDeal, id:334 }, 'STARTING'), true, 'starting-soon filter should use schedule status');
assert.equal(filters.matchesDealCategory({ ...searchableDeal, id:334 }, 'TONIGHT'), true, 'tonight filter should use schedule status');

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

console.log(`PASS: ${inlineScripts.length} inline scripts parse; search, category-filter, schedule, multi-window, and map-radius tests pass; core search/map functions exist.`);
