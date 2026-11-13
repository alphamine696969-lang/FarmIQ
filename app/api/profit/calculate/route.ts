import { NextRequest, NextResponse } from 'next/server';
import { calculateFarmProfit, ProfitCalculationInput } from '@/lib/calculations/profit';

export async function POST(req: NextRequest) {
  try {
    const body: ProfitCalculationInput = await req.json();

    if (!body || typeof body.areaValue !== 'number' || typeof body.expectedPricePerYieldUnit !== 'number') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payload: areaValue and expectedPricePerYieldUnit must be numbers.',
          },
        },
        { status: 400 }
      );
    }

    const result = calculateFarmProfit(body);

    return NextResponse.json({
      data: result,
      meta: {
        calculatedAt: new Date().toISOString(),
        engine: 'FarmIQ Deterministic Economics v1.0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to compute scenario economics.',
        },
      },
      { status: 500 }
    );
  }
}
