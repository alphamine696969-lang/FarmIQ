import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    application: 'FarmIQ Global Agricultural Intelligence',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    trustContract: {
      provenanceEnforced: true,
      pesticideSafetyGates: true,
      dataFreshnessLabeled: true,
    },
  });
}
