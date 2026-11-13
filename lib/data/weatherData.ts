/**
 * FarmIQ Agro-Meteorological Weather Service Model
 * Complies with FIQ-062, FIQ-063 and FarmIQ Provenance requirements.
 */

export interface AgroWeatherForecastDay {
  date: string;
  dayName: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationChance: number;
  humidityPercent: number;
  windSpeedKmh: number;
  evapotranspirationMm: number;
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
    soilTempC: number;
    soilMoisturePercent: number;
    solarRadiationWm2: number;
    dewPointC: number;
    uvIndex: number;
    condition: string;
  };
  forecast: AgroWeatherForecastDay[];
  alerts: AgroAlert[];
}

export const SAMPLE_WEATHER_DATA: FarmWeatherSnapshot = {
  locationName: "Green Valley Farm — Plot 3 (Valley Ridge)",
  coordinates: { lat: 40.7128, lng: -74.006 },
  retrievedAt: "2026-10-11T12:00:00Z",
  isSampleData: true,
  provider: "AgroWeather Provider Adapter (Simulated Station #8491)",
  current: {
    tempC: 19.4,
    feelsLikeC: 18.8,
    humidityPercent: 62,
    windSpeedKmh: 9.5,
    soilTempC: 16.2,
    soilMoisturePercent: 28,
    solarRadiationWm2: 640,
    dewPointC: 11.8,
    uvIndex: 5,
    condition: "Partly Cloudy"
  },
  forecast: [
    {
      date: "2026-10-11",
      dayName: "Today",
      tempMaxC: 22,
      tempMinC: 12,
      precipitationMm: 0,
      precipitationChance: 5,
      humidityPercent: 58,
      windSpeedKmh: 10,
      evapotranspirationMm: 3.8,
      condition: "Partly Sunny",
      icon: "sun",
      sprayingWindowRating: "Excellent",
      frostRisk: false,
      fieldWorkability: "Good"
    },
    {
      date: "2026-10-12",
      dayName: "Monday",
      tempMaxC: 24,
      tempMinC: 14,
      precipitationMm: 1.2,
      precipitationChance: 25,
      humidityPercent: 65,
      windSpeedKmh: 12,
      evapotranspirationMm: 4.1,
      condition: "Scattered Clouds",
      icon: "cloud",
      sprayingWindowRating: "Moderate",
      frostRisk: false,
      fieldWorkability: "Good"
    },
    {
      date: "2026-10-13",
      dayName: "Tuesday",
      tempMaxC: 19,
      tempMinC: 11,
      precipitationMm: 16.5,
      precipitationChance: 85,
      humidityPercent: 88,
      windSpeedKmh: 24,
      evapotranspirationMm: 1.9,
      condition: "Moderate Rain & Wind",
      icon: "cloud-rain",
      sprayingWindowRating: "Unfavorable",
      frostRisk: false,
      fieldWorkability: "Saturated Soil"
    },
    {
      date: "2026-10-14",
      dayName: "Wednesday",
      tempMaxC: 17,
      tempMinC: 7,
      precipitationMm: 4.0,
      precipitationChance: 40,
      humidityPercent: 78,
      windSpeedKmh: 18,
      evapotranspirationMm: 2.4,
      condition: "Cool Showers",
      icon: "cloud-drizzle",
      sprayingWindowRating: "Unfavorable",
      frostRisk: false,
      fieldWorkability: "Moderate"
    },
    {
      date: "2026-10-15",
      dayName: "Thursday",
      tempMaxC: 16,
      tempMinC: 3,
      precipitationMm: 0,
      precipitationChance: 0,
      humidityPercent: 52,
      windSpeedKmh: 8,
      evapotranspirationMm: 3.1,
      condition: "Clear & Crisp",
      icon: "sun",
      sprayingWindowRating: "Excellent",
      frostRisk: true,
      fieldWorkability: "Good"
    },
    {
      date: "2026-10-16",
      dayName: "Friday",
      tempMaxC: 20,
      tempMinC: 8,
      precipitationMm: 0,
      precipitationChance: 10,
      humidityPercent: 55,
      windSpeedKmh: 11,
      evapotranspirationMm: 3.6,
      condition: "Sunny",
      icon: "sun",
      sprayingWindowRating: "Excellent",
      frostRisk: false,
      fieldWorkability: "Good"
    },
    {
      date: "2026-10-17",
      dayName: "Saturday",
      tempMaxC: 21,
      tempMinC: 10,
      precipitationMm: 0,
      precipitationChance: 15,
      humidityPercent: 60,
      windSpeedKmh: 13,
      evapotranspirationMm: 3.7,
      condition: "Mild & Sunny",
      icon: "sun",
      sprayingWindowRating: "Excellent",
      frostRisk: false,
      fieldWorkability: "Good"
    }
  ],
  alerts: [
    {
      id: "alt-01",
      alertType: "Optimal Spraying Opportunity",
      severity: "low",
      title: "Calm Canopy Window Today (07:00 - 15:00)",
      description: "Low sustained wind speed (<10 km/h) and moderate RH (58%) allow even droplet deposition without drift.",
      agronomicAction: "Complete organic foliar micronutrient applications before Tuesday's forecasted rainfall.",
      issuedAt: "2026-10-11T06:00:00Z",
      validUntil: "2026-10-11T16:00:00Z",
      sourceProvider: "AgroWeather Drift & Adherence Model"
    },
    {
      id: "alt-02",
      alertType: "Frost Warning",
      severity: "high",
      title: "Late Week Nighttime Frost Hazard (Expected Min 3°C)",
      description: "Radiational cooling anticipated on Thursday night with ground temps possibly nearing 0°C in low valleys.",
      agronomicAction: "Consider protective mulching or row covers for tender vegetable seedling nurseries.",
      issuedAt: "2026-10-11T09:30:00Z",
      validUntil: "2026-10-15T08:00:00Z",
      sourceProvider: "National Agro-Meteorological Service Alert Feed"
    }
  ]
};
