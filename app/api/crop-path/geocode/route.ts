import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces } from '@/lib/integrations/weather/openMeteo';

/**
 * POST /api/crop-path/geocode — type-ahead place suggestions for the
 * village/region pickers. The farmer selects the exact place, which is the
 * fix for wrong-place weather: subsequent weather lookups use the chosen
 * coordinates directly. Allowlisted hosts only; user text is an encoded
 * query parameter (SSRF-safe).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body?.query === 'string' ? body.query.slice(0, 80).trim() : '';
    if (query.length < 3) {
      return NextResponse.json({ data: { suggestions: [] } });
    }
    const suggestions = await searchPlaces(query, 5);
    return NextResponse.json({
      data: { suggestions },
      meta: { provider: 'Open-Meteo Geocoding + Photon (OSM)', retrievedAt: new Date().toISOString() }
    });
  } catch (error) {
    console.error('[FarmIQ] geocode suggestions failed:', error);
    return NextResponse.json({ data: { suggestions: [] } });
  }
}
