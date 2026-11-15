/**
 * FarmIQ Agro-Meteorological Weather Service Model
 * Complies with FIQ-062, FIQ-063 and FarmIQ Provenance requirements.
 *
 * ADR-020: Apple WeatherKit is the primary weather service (with Open-Meteo
 * as the keyless fallback and soil/ET0 supplement). NASA POWER branding and
 * climatology payloads were removed; fields the new providers cannot supply
 * are nullable and rendered as "not available" — never invented.
 */

export interface AgroWeatherForecastDay {
  date: string;
  dayName: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationChance: number;
  /** null when the provider did not report a mean humidity for the day. */
  humidityPercent: number | null;
  /** null when the provider did not report wind for the day. */
  windSpeedKmh: number | null;
  /** FAO-56 ET0 (mm/day); null when not provided by the active provider. */
  evapotranspirationMm: number | null;
  condition: string;
  icon: string;
  sprayingWindowRating: 'Excellent' | 'Moderate' | 'Unfavorable';
  frostRisk: boolean;
  fieldWorkability: 'Good' | 'Moderate' | 'Saturated Soil';
}

export interface AgroAlert {
  id: string;
  alertType: 'Frost Warning' | 'High Evaporative Demand' | 'Foliar Blight Risk' | 'Optimal Spraying Opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  agronomicAction: string;
  issuedAt: string;
  validUntil: string;
  sourceProvider: string;
}

export interface FarmWeatherSnapshot {
  locationName: string;
  coordinates: { lat: number; lng: number };
  retrievedAt: string;
  isSampleData: boolean;
  provider: string;
  current: {
    tempC: number;
    feelsLikeC: number;
    humidityPercent: number;
    windSpeedKmh: number;
    /** null when the active providers do not report soil temperature. */
    soilTempC: number | null;
    /** null when the active providers do not report soil moisture. */
    soilMoisturePercent: number | null;
    /** null when the active providers do not report solar radiation. */
    solarRadiationWm2: number | null;
    dewPointC: number | null;
    uvIndex: number | null;
    condition: string;
  };
  forecast: AgroWeatherForecastDay[];
  alerts: AgroAlert[];
  /** Provenance note for fields served by a secondary provider (e.g. soil/ET0). */
  supplementarySource?: string;
}
