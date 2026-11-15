/**
 * FarmIQ Open-Meteo live weather adapter (FIQ-092).
 * Keyless, free-tier friendly live forecast provider. Server-side only.
 * Both hosts are hardcoded allowlist entries — user text is only ever sent
 * as an encoded query parameter, never as a URL (SSRF-safe by construction).
 */

const GEOCODING_HOST = 'https://geocoding-api.open-meteo.com/v1/search';
const PHOTON_HOST = 'https://photon.komoot.io/api';
const FORECAST_HOST = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 12_000;

export interface GeoLocation {
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

export interface OpenMeteoDaily {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationChancePct: number | null;
  humidityPct: number | null;
  windMaxKmh: number | null;
  et0Mm: number | null;
  uvIndexMax: number | null;
  weatherCode: number | null;
}

export interface OpenMeteoSnapshot {
  latitude: number;
  longitude: number;
  timezone: string;
  currentTempC: number | null;
  currentHumidityPct: number | null;
  daily: OpenMeteoDaily[];
  retrievedAt: string;
}

/** Rich current conditions + soil for the Weather page fallback (ADR-020). */
export interface OpenMeteoCurrentDetail {
  tempC: number;
  feelsLikeC: number;
  humidityPercent: number;
  dewPointC: number | null;
  windSpeedKmh: number;
  uvIndex: number | null;
  weatherCode: number | null;
  soilTempC: number | null;
  soilMoisturePercent: number | null;
}

/** Day condition text from a WMO weather code (open-meteo semantics). */
export function wmoConditionText(code: number | null): string {
  if (code === null) return 'Unknown';
  const map: Record<number, string> = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    56: 'Light Freezing Drizzle',
    57: 'Dense Freezing Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    66: 'Light Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Heavy Hail'
  };
  return map[code] ?? 'Unknown';
}

/** Rich agro snapshot: full current conditions (incl. soil) + daily with ET0. */
export interface OpenMeteoAgroSnapshot {
  current: OpenMeteoCurrentDetail;
  /** Shortwave solar radiation at ground level, W/m² (null when not reported). */
  shortwaveWm2: number | null;
  daily: OpenMeteoDaily[];
  retrievedAt: string;
}

/**
 * Single-call agro weather snapshot (ADR-020): current conditions including
 * soil temperature/moisture and solar radiation, plus a daily forecast with
 * FAO-56 ET0. Used by the Weather page directly (fallback) or as the
 * soil/ET0 supplement alongside Apple WeatherKit.
 */
export async function fetchOpenMeteoAgroSnapshot(
  lat: number,
  lon: number,
  days = 7
): Promise<OpenMeteoAgroSnapshot> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,dew_point_2m,wind_speed_10m,weather_code,uv_index,shortwave_radiation,soil_temperature_6cm,soil_moisture_3_to_9cm',
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,relative_humidity_2m_mean,wind_speed_10m_max,et0_fao_evapotranspiration,uv_index_max,weather_code',
    forecast_days: String(Math.min(16, Math.max(1, days))),
    timezone: 'auto'
  });
  const payload = await fetchJson(`${FORECAST_HOST}?${params.toString()}`);
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('open_meteo_error: malformed payload');
  }
  const rec = payload as Record<string, unknown>;
  const daily = rec.daily;
  const current = rec.current;
  if (typeof daily !== 'object' || daily === null || !Array.isArray((daily as Record<string, unknown>).time)) {
    throw new Error('open_meteo_error: missing daily arrays');
  }
  const d = daily as Record<string, unknown>;
  const times = d.time as unknown[];
  const dayList: OpenMeteoDaily[] = [];
  for (let i = 0; i < times.length; i += 1) {
    if (typeof times[i] !== 'string') continue;
    dayList.push({
      date: times[i] as string,
      tempMaxC: num((d.temperature_2m_max as unknown[])?.[i]) ?? NaN,
      tempMinC: num((d.temperature_2m_min as unknown[])?.[i]) ?? NaN,
      precipitationMm: num((d.precipitation_sum as unknown[])?.[i]) ?? NaN,
      precipitationChancePct: num((d.precipitation_probability_max as unknown[])?.[i]),
      humidityPct: num((d.relative_humidity_2m_mean as unknown[])?.[i]),
      windMaxKmh: num((d.wind_speed_10m_max as unknown[])?.[i]),
      et0Mm: num((d.et0_fao_evapotranspiration as unknown[])?.[i]),
      uvIndexMax: num((d.uv_index_max as unknown[])?.[i]),
      weatherCode: num((d.weather_code as unknown[])?.[i])
    });
  }
  if (dayList.length === 0) throw new Error('open_meteo_error: no usable forecast days');

  const c = (typeof current === 'object' && current !== null ? current : {}) as Record<string, unknown>;
  const tempC = num(c.temperature_2m);
  if (tempC === null) throw new Error('open_meteo_error: missing current temperature');

  // soil_moisture_3_to_9cm is a volume fraction (0–1) → percent.
  const soilMoistureRaw = num(c.soil_moisture_3_to_9cm);
  const currentDetail: OpenMeteoCurrentDetail = {
    tempC,
    feelsLikeC: num(c.apparent_temperature) ?? tempC,
    humidityPercent: Math.round(num(c.relative_humidity_2m) ?? 0),
    dewPointC: num(c.dew_point_2m),
    windSpeedKmh: num(c.wind_speed_10m) ?? 0,
    uvIndex: num(c.uv_index) === null ? null : Math.round(num(c.uv_index) as number),
    weatherCode: num(c.weather_code),
    soilTempC: num(c.soil_temperature_6cm),
    soilMoisturePercent:
      soilMoistureRaw === null ? null : Math.round(Math.min(1, Math.max(0, soilMoistureRaw)) * 100)
  };

  return {
    current: currentDetail,
    shortwaveWm2: num(c.shortwave_radiation),
    daily: dayList,
    retrievedAt: new Date().toISOString()
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`open_meteo_error_${response.status}: ${detail.slice(0, 160)}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A geocoder answer is only accepted when every significant token (≥3 chars,
 * minus qualifier words like "district"/"village") appears in the answer.
 * "any token" is too weak — a garbage query shares "nowhere" with a real US
 * town; "all tokens" lets "District Nashik" still match "Nashik".
 */
const QUERY_STOPWORDS = new Set(['district', 'division', 'block', 'tehsil', 'state', 'region', 'sector', 'taluka', 'near', 'village', 'town', 'city', 'of', 'the']);

function sharesQueryToken(query: string, candidates: Array<string | undefined>): boolean {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !QUERY_STOPWORDS.has(t));
  if (!tokens.length) return false;
  const haystack = candidates.filter(Boolean).join(' ').toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

export async function geocodeLocation(query: string): Promise<GeoLocation | null> {
  const q = query.trim();
  if (!q) return null;
  // Open-Meteo omits `results` entirely when it finds nothing, so an empty
  // answer is never conclusive — always let Photon (OSM) try before failing.
  try {
    const url = `${GEOCODING_HOST}?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
    const payload = await fetchJson(url);
    const results =
      typeof payload === 'object' && payload !== null && Array.isArray((payload as Record<string, unknown>).results)
        ? ((payload as Record<string, unknown>).results as unknown[])
        : [];
    const parsed = parseOpenMeteoGeo(results, q);
    if (parsed) return parsed;
  } catch {
    // Network-level failure — Photon is the fallback either way.
  }
  return geocodeWithPhoton(q);
}

function parseOpenMeteoGeo(results: unknown[], query: string): GeoLocation | null {
  if (results.length === 0) return null;
  const first = results[0];
  if (typeof first !== 'object' || first === null) return null;
  const rec = first as Record<string, unknown>;
  if (typeof rec.latitude !== 'number' || typeof rec.longitude !== 'number' || typeof rec.name !== 'string') return null;
  if (!sharesQueryToken(query, [rec.name, typeof rec.admin1 === 'string' ? rec.admin1 : undefined, typeof rec.country === 'string' ? rec.country : undefined])) {
    return null;
  }
  return {
    name: rec.name,
    admin1: typeof rec.admin1 === 'string' ? rec.admin1 : undefined,
    country: typeof rec.country === 'string' ? rec.country : undefined,
    countryCode: typeof rec.country_code === 'string' ? rec.country_code.toUpperCase() : undefined,
    latitude: rec.latitude,
    longitude: rec.longitude
  };
}

async function geocodeWithPhoton(q: string): Promise<GeoLocation | null> {
  try {
    const payload = await fetchJson(`${PHOTON_HOST}/?q=${encodeURIComponent(q)}&limit=1`);
    if (typeof payload !== 'object' || payload === null) return null;
    const features = (payload as Record<string, unknown>).features;
    if (!Array.isArray(features) || features.length === 0) return null;
    const feature = features[0];
    if (typeof feature !== 'object' || feature === null) return null;
    const rec = feature as Record<string, unknown>;
    const geometry = rec.geometry;
    const properties = rec.properties;
    if (typeof geometry !== 'object' || geometry === null || typeof properties !== 'object' || properties === null) return null;
    const coords = (geometry as Record<string, unknown>).coordinates;
    const props = properties as Record<string, unknown>;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    const [lon, lat] = coords as unknown[];
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;
    // Photon fuzzy-matches POIs (shops, addresses) on garbage queries — never
    // accept those, or a farmer's village gets weather for a random shop.
    const osmKey = typeof props.osm_key === 'string' ? props.osm_key : '';
    if (osmKey !== 'place' && osmKey !== 'boundary') return null;
    const name = typeof props.name === 'string' ? props.name : typeof props.city === 'string' ? props.city : q;
    if (!sharesQueryToken(q, [name, typeof props.city === 'string' ? props.city : undefined, typeof props.state === 'string' ? props.state : undefined, typeof props.country === 'string' ? props.country : undefined])) {
      return null;
    }
    return {
      name,
      admin1: typeof props.state === 'string' ? props.state : undefined,
      country: typeof props.country === 'string' ? props.country : undefined,
      countryCode: typeof props.countrycode === 'string' ? props.countrycode.toUpperCase() : undefined,
      latitude: lat,
      longitude: lon
    };
  } catch {
    return null;
  }
}

/**
 * Place suggestions for the type-ahead picker. Unlike geocodeLocation there
 * is no token guard: fuzzy candidates are fine because the farmer picks the
 * right one from the list (that selection is what fixes "wrong place").
 * Photon results are still restricted to places/boundaries (no shops).
 */
/**
 * Reverse geocode coordinates → place + country (Photon OSM reverse endpoint,
 * allowlisted host). Used by Markets to resolve the farmer's region from GPS.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  try {
    const payload = await fetchJson(`https://photon.komoot.io/reverse/?lat=${lat}&lon=${lon}`);
    if (typeof payload !== 'object' || payload === null) return null;
    const features = (payload as Record<string, unknown>).features;
    if (!Array.isArray(features) || features.length === 0) return null;
    const feature = features[0];
    if (typeof feature !== 'object' || feature === null) return null;
    const props = (feature as Record<string, unknown>).properties;
    if (typeof props !== 'object' || props === null) return null;
    const p = props as Record<string, unknown>;
    const name =
      (typeof p.city === 'string' && p.city) ||
      (typeof p.county === 'string' && p.county) ||
      (typeof p.state === 'string' && p.state) ||
      (typeof p.name === 'string' && p.name) ||
      null;
    if (!name) return null;
    return {
      name,
      admin1: typeof p.state === 'string' ? p.state : undefined,
      country: typeof p.country === 'string' ? p.country : undefined,
      countryCode: typeof p.countrycode === 'string' ? p.countrycode.toUpperCase() : undefined,
      latitude: lat,
      longitude: lon
    };
  } catch {
    return null;
  }
}

export async function searchPlaces(query: string, limit = 5): Promise<GeoLocation[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const out: GeoLocation[] = [];

  try {
    const payload = await fetchJson(`${GEOCODING_HOST}?name=${encodeURIComponent(q)}&count=${limit}&language=en&format=json`);
    const results =
      typeof payload === 'object' && payload !== null && Array.isArray((payload as Record<string, unknown>).results)
        ? ((payload as Record<string, unknown>).results as unknown[])
        : [];
    for (const item of results) {
      if (typeof item !== 'object' || item === null) continue;
      const rec = item as Record<string, unknown>;
      if (typeof rec.latitude !== 'number' || typeof rec.longitude !== 'number' || typeof rec.name !== 'string') continue;
      out.push({
        name: rec.name,
        admin1: typeof rec.admin1 === 'string' ? rec.admin1 : undefined,
        country: typeof rec.country === 'string' ? rec.country : undefined,
        countryCode: typeof rec.country_code === 'string' ? rec.country_code.toUpperCase() : undefined,
        latitude: rec.latitude,
        longitude: rec.longitude
      });
      if (out.length >= limit) break;
    }
  } catch {
    // fall through to Photon
  }

  if (out.length < limit) {
    try {
      const payload = await fetchJson(`${PHOTON_HOST}/?q=${encodeURIComponent(q)}&limit=${limit}`);
      const features =
        typeof payload === 'object' && payload !== null && Array.isArray((payload as Record<string, unknown>).features)
          ? ((payload as Record<string, unknown>).features as unknown[])
          : [];
      for (const item of features) {
        if (out.length >= limit) break;
        if (typeof item !== 'object' || item === null) continue;
        const rec = item as Record<string, unknown>;
        const geometry = rec.geometry;
        const properties = rec.properties;
        if (typeof geometry !== 'object' || geometry === null || typeof properties !== 'object' || properties === null) continue;
        const coords = (geometry as Record<string, unknown>).coordinates;
        const props = properties as Record<string, unknown>;
        if (!Array.isArray(coords) || coords.length < 2) continue;
        const [lon, lat] = coords as unknown[];
        if (typeof lat !== 'number' || typeof lon !== 'number') continue;
        const osmKey = typeof props.osm_key === 'string' ? props.osm_key : '';
        if (osmKey !== 'place' && osmKey !== 'boundary') continue;
        const name = typeof props.name === 'string' ? props.name : typeof props.city === 'string' ? props.city : undefined;
        if (!name) continue;
        const dup = out.some(
          (o) => o.name === name && Math.abs(o.latitude - lat) < 0.01 && Math.abs(o.longitude - lon) < 0.01
        );
        if (dup) continue;
        out.push({
          name,
          admin1: typeof props.state === 'string' ? props.state : typeof props.county === 'string' ? props.county : undefined,
          country: typeof props.country === 'string' ? props.country : undefined,
          countryCode: typeof props.countrycode === 'string' ? props.countrycode.toUpperCase() : undefined,
          latitude: lat,
          longitude: lon
        });
      }
    } catch {
      // suggestions degrade to whatever we have
    }
  }

  return out.slice(0, limit);
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function fetchOpenMeteoForecast(lat: number, lon: number, days = 7): Promise<OpenMeteoSnapshot> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,relative_humidity_2m_mean,wind_speed_10m_max,et0_fao_evapotranspiration,uv_index_max,weather_code',
    forecast_days: String(Math.min(16, Math.max(1, days))),
    timezone: 'auto'
  });
  const payload = await fetchJson(`${FORECAST_HOST}?${params.toString()}`);
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('open_meteo_error: malformed payload');
  }
  const rec = payload as Record<string, unknown>;
  const daily = rec.daily;
  const current = rec.current;
  if (typeof daily !== 'object' || daily === null || !Array.isArray((daily as Record<string, unknown>).time)) {
    throw new Error('open_meteo_error: missing daily arrays');
  }
  const d = daily as Record<string, unknown>;
  const times = d.time as unknown[];
  const dayList: OpenMeteoDaily[] = [];
  for (let i = 0; i < times.length; i += 1) {
    if (typeof times[i] !== 'string') continue;
    dayList.push({
      date: times[i] as string,
      tempMaxC: num((d.temperature_2m_max as unknown[])?.[i]) ?? NaN,
      tempMinC: num((d.temperature_2m_min as unknown[])?.[i]) ?? NaN,
      precipitationMm: num((d.precipitation_sum as unknown[])?.[i]) ?? NaN,
      precipitationChancePct: num((d.precipitation_probability_max as unknown[])?.[i]),
      humidityPct: num((d.relative_humidity_2m_mean as unknown[])?.[i]),
      windMaxKmh: num((d.wind_speed_10m_max as unknown[])?.[i]),
      et0Mm: num((d.et0_fao_evapotranspiration as unknown[])?.[i]),
      uvIndexMax: num((d.uv_index_max as unknown[])?.[i]),
      weatherCode: num((d.weather_code as unknown[])?.[i])
    });
  }
  if (dayList.length === 0) throw new Error('open_meteo_error: no usable forecast days');

  const currentTemp = current && typeof current === 'object' ? num((current as Record<string, unknown>).temperature_2m) : null;
  const currentHumidity = current && typeof current === 'object' ? num((current as Record<string, unknown>).relative_humidity_2m) : null;

  return {
    latitude: typeof rec.latitude === 'number' ? rec.latitude : lat,
    longitude: typeof rec.longitude === 'number' ? rec.longitude : lon,
    timezone: typeof rec.timezone === 'string' ? rec.timezone : 'auto',
    currentTempC: currentTemp,
    currentHumidityPct: currentHumidity,
    daily: dayList,
    retrievedAt: new Date().toISOString()
  };
}

export interface RecentClimate {
  /** Mean daily temperature over the observed window (°C). */
  avgTempC: number;
  /** Total precipitation over the observed window (mm). */
  totalPrecipMm: number;
  daysCounted: number;
  windowDays: number;
  sourceName: string;
  retrievedAt: string;
}

/**
 * Observed climate for the last 90 days (Open-Meteo forecast API, past_days=90).
 * Used by the Crop Advisor as honest recent conditions for a location —
 * labeled as observed history, not a climate normal or a forecast.
 */
export async function fetchRecentClimate(lat: number, lon: number, windowDays = 90): Promise<RecentClimate | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'temperature_2m_mean,precipitation_sum',
    past_days: String(Math.min(92, Math.max(30, windowDays))),
    forecast_days: '1',
    timezone: 'auto'
  });
  try {
    const payload = await fetchJson(`${FORECAST_HOST}?${params.toString()}`);
    if (typeof payload !== 'object' || payload === null) return null;
    const daily = (payload as Record<string, unknown>).daily;
    if (typeof daily !== 'object' || daily === null) return null;
    const d = daily as Record<string, unknown>;
    const temps = Array.isArray(d.temperature_2m_mean) ? (d.temperature_2m_mean as unknown[]) : [];
    const precips = Array.isArray(d.precipitation_sum) ? (d.precipitation_sum as unknown[]) : [];
    const today = new Date().toISOString().slice(0, 10);
    const times = Array.isArray(d.time) ? (d.time as unknown[]) : [];
    let tempSum = 0;
    let precipSum = 0;
    let counted = 0;
    for (let i = 0; i < temps.length; i += 1) {
      const date = typeof times[i] === 'string' ? (times[i] as string) : '';
      if (date > today) continue; // observed window only — no forecast days
      const t = num(temps[i]);
      if (t === null) continue;
      tempSum += t;
      counted += 1;
      const p = num(precips[i]);
      if (p !== null && p >= 0) precipSum += p;
    }
    if (counted < 30) return null;
    return {
      avgTempC: Number((tempSum / counted).toFixed(1)),
      totalPrecipMm: Number(precipSum.toFixed(0)),
      daysCounted: counted,
      windowDays: Math.min(92, Math.max(30, windowDays)),
      sourceName: `Open-Meteo observed (last ${counted} days)`,
      retrievedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}
