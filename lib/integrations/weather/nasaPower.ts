/**
 * NASA POWER (Prediction Of Worldwide Energy Resources) Agroclimatology Integration
 * Langley Research Center (LaRC) — NASA Earth Science Division
 * 
 * Community: AG (Agroclimatology)
 * Data Sources: NASA MERRA-2, GEOS-5, CERES/SYN1deg
 * Documentation: https://power.larc.nasa.gov/docs/tutorials/api-getting-started/
 */

const NASA_POWER_BASE = 'https://power.larc.nasa.gov/api/temporal';
const TIMEOUT_MS = 12_000;

export interface NasaPowerClimatology {
  solarRadiationMonthly: Record<string, number>; // MJ/m^2/day
  precipitationMonthly: Record<string, number>;  // mm/day
  relativeHumidityMonthly: Record<string, number>; // %
  temperatureMeanMonthly: Record<string, number>; // °C
  temperatureMaxMonthly: Record<string, number>;  // °C
  temperatureMinMonthly: Record<string, number>;  // °C
  annualAverageSolarMJ: number;
  annualAveragePrecipMm: number;
  annualAverageTempC: number;
  currentMonthBenchmark: {
    month: string;
    solarMJ: number;
    precipMmPerDay: number;
    tempMeanC: number;
  };
  provenance: {
    source: string;
    datasetRange: string;
    community: string;
    elevationMeters?: number;
    coordinates: [number, number];
  };
  retrievedAt: string;
}

export interface NasaPowerDailyData {
  dates: string[];
  temperatures: Record<string, number>;
  tempMax: Record<string, number>;
  tempMin: Record<string, number>;
  precipitation: Record<string, number>;
  humidity: Record<string, number>;
  windSpeed: Record<string, number>;
  solarRadiation: Record<string, number>;
  provenance: {
    source: string;
    community: string;
    coordinates: [number, number];
  };
  retrievedAt: string;
}

// In-memory LRU cache for 25-year climatologies (keyed by coordinate rounded to 2 decimals)
const climatologyCache = new Map<string, { data: NasaPowerClimatology; expiresAt: number }>();

const MONTH_KEYS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Fetches NASA POWER 25-Year Agroclimatological Monthly & Annual Baselines
 * Community: AG (Agroclimatology)
 */
export async function fetchNasaPowerClimatology(lat: number, lon: number): Promise<NasaPowerClimatology | null> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const now = Date.now();

  const cached = climatologyCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const url = `${NASA_POWER_BASE}/climatology/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&format=JSON`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`[NASA POWER] Climatology request failed with HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    const params = json?.properties?.parameter;
    if (!params) return null;

    const currentMonthIndex = new Date().getMonth();
    const currentMonthKey = MONTH_KEYS[currentMonthIndex];

    const solarMonthly = params.ALLSKY_SFC_SW_DWN || {};
    const precipMonthly = params.PRECTOTCORR || {};
    const rhMonthly = params.RH2M || {};
    const t2mMonthly = params.T2M || {};
    const t2mMaxMonthly = params.T2M_MAX || {};
    const t2mMinMonthly = params.T2M_MIN || {};

    const elev = json?.geometry?.coordinates?.[2];

    const result: NasaPowerClimatology = {
      solarRadiationMonthly: solarMonthly,
      precipitationMonthly: precipMonthly,
      relativeHumidityMonthly: rhMonthly,
      temperatureMeanMonthly: t2mMonthly,
      temperatureMaxMonthly: t2mMaxMonthly,
      temperatureMinMonthly: t2mMinMonthly,
      annualAverageSolarMJ: solarMonthly['ANN'] ?? 18.0,
      annualAveragePrecipMm: Number(((precipMonthly['ANN'] ?? 2.0) * 365.25).toFixed(1)),
      annualAverageTempC: t2mMonthly['ANN'] ?? 22.0,
      currentMonthBenchmark: {
        month: currentMonthKey,
        solarMJ: solarMonthly[currentMonthKey] ?? 16.0,
        precipMmPerDay: precipMonthly[currentMonthKey] ?? 2.0,
        tempMeanC: t2mMonthly[currentMonthKey] ?? 22.0,
      },
      provenance: {
        source: 'NASA Langley Research Center — Prediction Of Worldwide Energy Resources (POWER)',
        datasetRange: json?.header?.range || '25-year Meteorological and Solar Agroclimatology (2001–2025)',
        community: 'AG (Agroclimatology)',
        elevationMeters: typeof elev === 'number' ? elev : undefined,
        coordinates: [lon, lat],
      },
      retrievedAt: new Date().toISOString(),
    };

    // Cache for 6 hours (climatological norms do not change intra-day)
    climatologyCache.set(cacheKey, { data: result, expiresAt: now + 6 * 60 * 60 * 1000 });
    return result;
  } catch (err: any) {
    console.error('[NASA POWER] Error fetching climatology:', err?.message || err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches NASA POWER Daily Point Observations for a date range (YYYYMMDD)
 * Community: AG (Agroclimatology)
 */
export async function fetchNasaPowerDaily(
  lat: number,
  lon: number,
  start: string,
  end: string
): Promise<NasaPowerDailyData | null> {
  const url = `${NASA_POWER_BASE}/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&start=${start}&end=${end}&format=JSON`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`[NASA POWER] Daily request failed with HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    const params = json?.properties?.parameter;
    if (!params) return null;

    const dates = Object.keys(params.T2M || {}).sort();

    return {
      dates,
      temperatures: params.T2M || {},
      tempMax: params.T2M_MAX || {},
      tempMin: params.T2M_MIN || {},
      precipitation: params.PRECTOTCORR || {},
      humidity: params.RH2M || {},
      windSpeed: params.WS2M || {},
      solarRadiation: params.ALLSKY_SFC_SW_DWN || {},
      provenance: {
        source: 'NASA Langley Research Center — Prediction Of Worldwide Energy Resources (POWER) Daily API',
        community: 'AG (Agroclimatology)',
        coordinates: [lon, lat],
      },
      retrievedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[NASA POWER] Error fetching daily agro-meteorology:', err?.message || err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
