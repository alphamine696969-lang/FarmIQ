/**
 * Apple WeatherKit REST API adapter (ADR-020) — replaces NASA POWER as the
 * weather service for /api/weather/current.
 *
 * Docs: https://developer.apple.com/documentation/weatherkitrestapi
 *   GET /api/v1/weather/{language}/{latitude}/{longitude}?dataSets=current,forecastDaily
 *
 * Authentication: ES256-signed developer JWT (header alg/kid/id, claims
 * iss/iat/exp/sub) minted from the Apple Developer Program WeatherKit key.
 * Secrets stay server-side; nothing here logs key material.
 *
 * Unconfigured (no Apple keys) or failure returns null — callers must fall
 * back to the keyless Open-Meteo path and label the provider honestly
 * (ADR-005). No data is ever fabricated here.
 */

import { createPrivateKey, sign as cryptoSign } from 'node:crypto';

const WEATHERKIT_BASE = 'https://weatherkit.apple.com/api/v1/weather';
const TIMEOUT_MS = 12_000;
const TOKEN_LIFETIME_SEC = 55 * 60;
const TOKEN_REFRESH_MARGIN_SEC = 60;

export interface WeatherKitConfig {
  teamId: string;
  keyId: string;
  serviceId: string;
  privateKeyPem: string;
}

export interface WeatherKitCurrent {
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  dewPointC: number;
  windSpeedKmh: number;
  windGustKmh: number | null;
  uvIndex: number | null;
  conditionCode: string;
  asOf: string;
}

export interface WeatherKitDay {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationChancePercent: number;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  conditionCode: string;
}

export interface WeatherKitSnapshot {
  current: WeatherKitCurrent;
  days: WeatherKitDay[];
  retrievedAt: string;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function requireNum(value: unknown): number | null {
  const n = num(value);
  return n;
}

/** Read config from env. Private key supports literal "\n" escaped PEM. */
export function getWeatherKitConfig(): WeatherKitConfig | null {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const serviceId = process.env.APPLE_SERVICE_ID?.trim();
  const rawKey = process.env.APPLE_PRIVATE_KEY?.trim();
  if (!teamId || !keyId || !serviceId || !rawKey) return null;
  const privateKeyPem = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  if (!privateKeyPem.includes('PRIVATE KEY')) return null;
  return { teamId, keyId, serviceId, privateKeyPem };
}

export function isWeatherKitConfigured(): boolean {
  return getWeatherKitConfig() !== null;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

/**
 * Build an ES256 WeatherKit developer token.
 * Header: { alg: ES256, kid: keyId, id: `${teamId}.${serviceId}` }
 * Claims: { iss: teamId, iat, exp, sub: serviceId }
 * Pure + exported for tests (sign with a generated P-256 key).
 */
export function buildWeatherKitToken(
  config: WeatherKitConfig,
  nowSec: number = Math.floor(Date.now() / 1000)
): string {
  const header = { alg: 'ES256', kid: config.keyId, id: `${config.teamId}.${config.serviceId}` };
  const payload = { iss: config.teamId, iat: nowSec, exp: nowSec + TOKEN_LIFETIME_SEC, sub: config.serviceId };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = createPrivateKey(config.privateKeyPem);
  // ieee-p1363 → JOSE raw r||s signature (not DER), required by JWT ES256.
  const signature = cryptoSign('sha256', Buffer.from(signingInput), {
    key,
    dsaEncoding: 'ieee-p1363'
  });
  return `${signingInput}.${signature.toString('base64url')}`;
}

let cachedToken: { token: string; expiresAtSec: number } | null = null;

function getBearerToken(config: WeatherKitConfig): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAtSec - TOKEN_REFRESH_MARGIN_SEC > now) {
    return cachedToken.token;
  }
  const token = buildWeatherKitToken(config, now);
  cachedToken = { token, expiresAtSec: now + TOKEN_LIFETIME_SEC };
  return token;
}

/** Humanize WeatherKit condition codes ("partlyCloudy" → "Partly Cloudy"). */
export function formatWeatherKitCondition(code: string): string {
  const known: Record<string, string> = {
    clear: 'Clear',
    mostlyClear: 'Mostly Clear',
    partlyCloudy: 'Partly Cloudy',
    mostlyCloudy: 'Mostly Cloudy',
    cloudy: 'Cloudy',
    fog: 'Fog',
    haze: 'Haze',
    drizzle: 'Drizzle',
    rain: 'Rain',
    heavyRain: 'Heavy Rain',
    snow: 'Snow',
    flurries: 'Snow Flurries',
    blowingSnow: 'Blowing Snow',
    sleet: 'Sleet',
    hail: 'Hail',
    thunderstorms: 'Thunderstorms',
    isolatedThunderstorms: 'Isolated Thunderstorms',
    scatteredThunderstorms: 'Scattered Thunderstorms',
    strongStorms: 'Strong Storms',
    windy: 'Windy'
  };
  if (known[code]) return known[code];
  // camelCase fallback: "wintryMix" → "Wintry Mix"
  return code
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

/** Map a WeatherKit `current` object to our typed shape (null on bad input). */
export function mapWeatherKitCurrent(raw: unknown): WeatherKitCurrent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const c = raw as Record<string, unknown>;
  const temperatureC = requireNum(c.temperature);
  const feelsLikeC = requireNum(c.temperatureApparent);
  const humidityRaw = requireNum(c.humidity);
  if (temperatureC === null || feelsLikeC === null || humidityRaw === null) return null;
  return {
    temperatureC,
    feelsLikeC,
    // WeatherKit humidity is 0–1 → percent
    humidityPercent: Math.round(Math.min(1, Math.max(0, humidityRaw)) * 100),
    dewPointC: num(c.temperatureDewPoint) ?? 0,
    windSpeedKmh: num(c.windSpeed) ?? 0,
    windGustKmh: num(c.windGust),
    uvIndex: num(c.uvIndex) === null ? null : Math.round(num(c.uvIndex) as number),
    conditionCode: typeof c.conditionCode === 'string' ? c.conditionCode : 'unknown',
    asOf: typeof c.asOf === 'string' ? c.asOf : new Date().toISOString()
  };
}

/** Map one WeatherKit forecastDaily.days[] entry (null on bad input). */
export function mapWeatherKitDay(raw: unknown, index: number): WeatherKitDay | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const d = raw as Record<string, unknown>;
  const tempMaxC = requireNum(d.temperatureMax);
  const tempMinC = requireNum(d.temperatureMin);
  if (tempMaxC === null || tempMinC === null) return null;
  const start = typeof d.forecastStart === 'string' ? d.forecastStart : '';
  const date = start ? start.slice(0, 10) : new Date(Date.now() + index * 86400000).toISOString().slice(0, 10);
  const chanceRaw = num(d.precipitationChance);
  const daytime = (d.daytimeForecast ?? null) as Record<string, unknown> | null;
  const humidityRaw = daytime ? num(daytime.humidity) : null;
  return {
    date,
    tempMaxC,
    tempMinC,
    precipitationMm: num(d.precipitationAmount) ?? 0,
    // WeatherKit chance is 0–1 → percent
    precipitationChancePercent:
      chanceRaw === null ? 0 : Math.round(Math.min(1, Math.max(0, chanceRaw)) * 100),
    humidityPercent:
      humidityRaw === null ? null : Math.round(Math.min(1, Math.max(0, humidityRaw)) * 100),
    windSpeedKmh: daytime ? num(daytime.windSpeed) : null,
    conditionCode: typeof d.conditionCode === 'string' ? d.conditionCode : 'unknown'
  };
}

/**
 * Fetch current + 7-day daily forecast from WeatherKit.
 * Returns null when unconfigured, unauthorized (401 — paid Apple Developer
 * Program + WeatherKit key required), or the payload is unusable.
 */
export async function fetchWeatherKitSnapshot(
  lat: number,
  lon: number,
  days = 7
): Promise<WeatherKitSnapshot | null> {
  const config = getWeatherKitConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    dataSets: 'current,forecastDaily',
    timezone: 'auto'
  });
  const url = `${WEATHERKIT_BASE}/en/${lat.toFixed(4)}/${lon.toFixed(4)}?${params.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${getBearerToken(config)}`, Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) {
      console.warn(`[WeatherKit] request failed with HTTP ${response.status}`);
      return null;
    }
    const payload = (await response.json()) as Record<string, unknown>;
    const current = mapWeatherKitCurrent(payload.current);
    const daysRaw = (payload.forecastDaily as { days?: unknown } | undefined)?.days;
    if (!current || !Array.isArray(daysRaw)) return null;

    const mappedDays: WeatherKitDay[] = [];
    for (let i = 0; i < daysRaw.length && mappedDays.length < days; i += 1) {
      const day = mapWeatherKitDay(daysRaw[i], i);
      if (day) mappedDays.push(day);
    }
    if (mappedDays.length === 0) return null;

    return { current, days: mappedDays, retrievedAt: new Date().toISOString() };
  } catch (err) {
    console.warn('[WeatherKit] fetch failed:', err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
