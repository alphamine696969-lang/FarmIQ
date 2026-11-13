import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_MARKET_OBSERVATIONS } from '@/lib/data/mockDatabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crop = searchParams.get('crop');

  let results = INITIAL_MARKET_OBSERVATIONS;
  if (crop && crop !== 'All') {
    results = results.filter((o) => o.cropName.toLowerCase().includes(crop.toLowerCase()));
  }

  return NextResponse.json({
    data: {
      observations: results,
      totalCount: results.length,
    },
    meta: {
      source: 'USDA AMS & Agmarknet Benchmark Adapter',
      retrievedAt: new Date().toISOString(),
      isSampleData: true,
      dataClassification: 'sample-historical',
    },
  });
}
