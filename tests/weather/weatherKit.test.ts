/**
 * Apple WeatherKit adapter tests (ADR-020).
 * ES256 developer token (structure + signature), response mappers, condition
 * formatting, and honest unconfigured behavior — all offline (generated key).
 */
import assert from 'node:assert';
import { generateKeyPairSync, verify } from 'node:crypto';
import {
  buildWeatherKitToken,
  getWeatherKitConfig,
  isWeatherKitConfigured,
  fetchWeatherKitSnapshot,
  mapWeatherKitCurrent,
  mapWeatherKitDay,
  formatWeatherKitCondition,
  WeatherKitConfig
} from '../../lib/integrations/weather/weatherKit';
import { wmoConditionText } from '../../lib/integrations/weather/openMeteo';

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function decodeJwtPart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

async function run(): Promise<void> {
  console.log('Running FarmIQ Apple WeatherKit Test Suite...');

  // Deterministic unconfigured state (no ambient Apple keys).
  delete process.env.APPLE_TEAM_ID;
  delete process.env.APPLE_KEY_ID;
  delete process.env.APPLE_SERVICE_ID;
  delete process.env.APPLE_PRIVATE_KEY;

  /* ---------------------------- Unconfigured ---------------------------- */
  assertEqual(getWeatherKitConfig(), null, 'config null without env vars');
  assertEqual(isWeatherKitConfigured(), false, 'not configured without env vars');
  const offline = await fetchWeatherKitSnapshot(30.9, 75.8);
  assertEqual(offline, null, 'unconfigured fetch returns null (never fabricates)');
  console.log('✔ Unconfigured WeatherKit reports honestly and returns null');

  /* --------------------------- Config parsing --------------------------- */
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

  process.env.APPLE_TEAM_ID = 'ABCDE12345';
  process.env.APPLE_KEY_ID = 'KEY1234567';
  process.env.APPLE_SERVICE_ID = 'com.farmiq.weatherkit';
  // Escaped-newline PEM (common in .env files) must be accepted.
  process.env.APPLE_PRIVATE_KEY = pem.replace(/\n/g, '\\n');
  const config = getWeatherKitConfig();
  assert(config, 'config parsed from env');
  assert(config!.privateKeyPem.includes('\n'), 'escaped newlines restored in PEM');
  assertEqual(isWeatherKitConfigured(), true, 'configured with all four vars');

  process.env.APPLE_PRIVATE_KEY = 'not-a-key';
  assertEqual(getWeatherKitConfig(), null, 'non-PEM private key rejected');
  process.env.APPLE_PRIVATE_KEY = pem.replace(/\n/g, '\\n');
  console.log('✔ Config parsing accepts escaped PEM and rejects junk keys');

  /* ------------------------------ ES256 JWT ------------------------------ */
  const now = 1_700_000_000;
  const token = buildWeatherKitToken(config!, now);
  const parts = token.split('.');
  assertEqual(parts.length, 3, 'JWT has three base64url parts');

  const header = decodeJwtPart(parts[0]);
  assertEqual(header.alg, 'ES256', 'header alg is ES256');
  assertEqual(header.kid, 'KEY1234567', 'header kid is the key id');
  assertEqual(header.id, 'ABCDE12345.com.farmiq.weatherkit', 'header id is teamId.serviceId');

  const claims = decodeJwtPart(parts[1]);
  assertEqual(claims.iss, 'ABCDE12345', 'iss is the Team ID');
  assertEqual(claims.sub, 'com.farmiq.weatherkit', 'sub is the Service ID');
  assertEqual(claims.iat, now, 'iat captured');
  assertEqual(claims.exp, now + 55 * 60, 'exp is iat + 55 minutes');
  assert(!('typ' in claims) && Object.keys(claims).sort().join(',') === 'exp,iat,iss,sub', 'claims contain only iss/iat/exp/sub');

  const signatureOk = verify(
    'sha256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    { key: publicKey, dsaEncoding: 'ieee-p1363' },
    Buffer.from(parts[2], 'base64url')
  );
  assert(signatureOk, 'ES256 signature verifies with the matching P-256 public key');

  const wrongKey = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).publicKey;
  const forged = verify(
    'sha256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    { key: wrongKey, dsaEncoding: 'ieee-p1363' },
    Buffer.from(parts[2], 'base64url')
  );
  assert(!forged, 'signature fails with a different key');
  console.log('✔ ES256 developer token: structure, claims, and signature verified');

  /* ------------------------------- Mappers ------------------------------- */
  const current = mapWeatherKitCurrent({
    asOf: '2026-11-15T12:00:00Z',
    conditionCode: 'partlyCloudy',
    humidity: 0.72,
    temperature: 24.6,
    temperatureApparent: 25.4,
    temperatureDewPoint: 19.1,
    windSpeed: 12.4,
    windGust: 20.2,
    uvIndex: 6.4
  });
  assert(current, 'current mapper accepts a full payload');
  assertEqual(current!.humidityPercent, 72, 'humidity 0–1 → percent');
  assertEqual(current!.temperatureC, 24.6, 'temperature in °C kept');
  assertEqual(current!.uvIndex, 6, 'uvIndex rounded to integer');
  assertEqual(current!.conditionCode, 'partlyCloudy', 'condition code preserved');
  assertEqual(mapWeatherKitCurrent({ temperature: null }), null, 'current without temperature → null');
  assertEqual(mapWeatherKitCurrent(null), null, 'non-object current → null');

  const day = mapWeatherKitDay(
    {
      forecastStart: '2026-11-16T00:00:00+05:30',
      temperatureMax: 28.2,
      temperatureMin: 14.7,
      precipitationAmount: 3.4,
      precipitationChance: 0.65,
      conditionCode: 'rain',
      daytimeForecast: { humidity: 0.58, windSpeed: 15.1 }
    },
    0
  );
  assert(day, 'day mapper accepts a full payload');
  assertEqual(day!.date, '2026-11-16', 'date extracted from forecastStart');
  assertEqual(day!.precipitationChancePercent, 65, 'chance 0–1 → percent');
  assertEqual(day!.humidityPercent, 58, 'daytime humidity 0–1 → percent');
  assertEqual(day!.windSpeedKmh, 15.1, 'daytime wind kept');
  assertEqual(mapWeatherKitDay({ temperatureMax: null, temperatureMin: 2 }, 1), null, 'day without temps → null');
  const noStart = mapWeatherKitDay({ temperatureMax: 20, temperatureMin: 10 }, 3);
  assertEqual(noStart!.date, new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), 'date falls back to index offset');

  /* --------------------------- Condition labels -------------------------- */
  assertEqual(formatWeatherKitCondition('partlyCloudy'), 'Partly Cloudy', 'known code formatted');
  assertEqual(formatWeatherKitCondition('clear'), 'Clear', 'known simple code');
  assertEqual(formatWeatherKitCondition('wintryMix'), 'Wintry Mix', 'unknown camelCase code humanized');
  assertEqual(formatWeatherKitCondition('rain'), 'Rain', 'rain code');
  assertEqual(wmoConditionText(0), 'Clear Sky', 'WMO 0 → Clear Sky');
  assertEqual(wmoConditionText(95), 'Thunderstorm', 'WMO 95 → Thunderstorm');
  assertEqual(wmoConditionText(null), 'Unknown', 'null WMO code → Unknown');
  console.log('✔ Mappers and condition labels handle real payloads and bad input');

  // Cleanup env for other suites.
  delete process.env.APPLE_TEAM_ID;
  delete process.env.APPLE_KEY_ID;
  delete process.env.APPLE_SERVICE_ID;
  delete process.env.APPLE_PRIVATE_KEY;

  assertEqual(isWeatherKitConfigured(), false, 'cleanup restores unconfigured state');
  console.log('All Apple WeatherKit tests passed successfully!');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
