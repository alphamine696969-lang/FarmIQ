import { NextResponse } from 'next/server';
import { SAMPLE_WEATHER_DATA } from '@/lib/data/weatherData';

export async function GET() {
  return NextResponse.json({
    data: SAMPLE_WEATHER_DATA,
    meta: {
      provider: SAMPLE_WEATHER_DATA.provider,
      retrievedAt: new Date().toISOString(),
      isSampleData: true,
      classification: 'sample-historical',
    },
  });
}
