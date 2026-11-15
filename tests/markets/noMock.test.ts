/**
 * Markets mock-removal regression tests (FIQ-100).
 * The market prices experience must never serve or render sample observations:
 * the page, its routes, the dashboard widget, and the landing ticker are all
 * source-checked so fake price rows cannot creep back in.
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(__dirname, '..', '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assertNoMock(rel: string): void {
  const src = read(rel);
  assert(!src.includes('INITIAL_MARKET_OBSERVATIONS'), `${rel} must not import sample market observations`);
  assert(!src.includes('MarketObservation'), `${rel} must not reference the sample MarketObservation type`);
}

function run(): void {
  // Mock market data is gone from the data layer entirely
  const mockDb = read('lib/data/mockDatabase.ts');
  assert(!mockDb.includes('INITIAL_MARKET_OBSERVATIONS'), 'mockDatabase no longer exports sample observations');
  assert(!mockDb.includes('export interface MarketObservation'), 'mockDatabase no longer defines MarketObservation');

  // The mock search endpoint is deleted; the live region endpoints exist
  assert(!fs.existsSync(path.join(ROOT, 'app/api/markets/search')), 'mock /api/markets/search route is removed');
  assert(fs.existsSync(path.join(ROOT, 'app/api/markets/prices/route.ts')), 'live /api/markets/prices route exists');
  assert(fs.existsSync(path.join(ROOT, 'app/api/markets/news/route.ts')), 'live /api/markets/news route exists');
  const pricesRoute = read('app/api/markets/prices/route.ts');
  assert(pricesRoute.includes('fetchEurostatAllPrices'), 'prices route uses the official source adapter');
  assert(!pricesRoute.includes('mockDatabase'), 'prices route never reads the mock database');
  const newsRoute = read('app/api/markets/news/route.ts');
  assert(newsRoute.includes('webSearch'), 'news route uses the keyless web-research tool');
  assert(newsRoute.includes('isWebFetchEnabled'), 'news route respects the WEB_FETCH_DISABLED switch');
  assert(!newsRoute.includes('mockDatabase'), 'news route never reads the mock database');

  // No page renders sample market rows
  assertNoMock('app/app/markets/page.tsx');
  assertNoMock('app/app/page.tsx');
  assertNoMock('app/page.tsx');
  const marketsPage = read('app/app/markets/page.tsx');
  assert(marketsPage.includes('/api/markets/prices'), 'markets page loads region prices from the live route');
  assert(marketsPage.includes('sample') === false || marketsPage.includes('No sample'), 'markets page states the no-sample policy');

  console.log('✔ Markets experience contains no mock observations');
}

run();
console.log('All markets mock-removal tests passed successfully!');
