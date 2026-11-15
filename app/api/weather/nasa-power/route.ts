import { NextRequest, NextResponse } from 'next/server';
import { fetchNasaPowerClimatology, fetchNasaPowerDaily } from '@/lib/integrations/weather/nasaPower';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const type = searchParams.get('type') || 'climatology'; // 'climatology' | 'daily'
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { error: 'Coordinates required. Please provide ?lat=...&lon=...' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: 'Latitude and longitude must be valid floating point numbers' },
      { status: 400 }
    );
  }

  try {
    if (type === 'daily' && start && end) {
      const dailyData = await fetchNasaPowerDaily(lat, lon, start, end);
      if (!dailyData) {
        return NextResponse.json(
          { error: 'Unable to retrieve NASA POWER daily data for these coordinates.' },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, data: dailyData });
    }

    // Default: Climatology
    const climatology = await fetchNasaPowerClimatology(lat, lon);
    if (!climatology) {
      return NextResponse.json(
        { error: 'Unable to retrieve NASA POWER climatology for these coordinates.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: climatology });
  } catch (err: any) {
    console.error('NASA POWER API route error:', err);
    return NextResponse.json(
      { error: 'Internal server error while querying NASA POWER API: ' + (err?.message || 'unknown') },
      { status: 500 }
    );
  }
}

