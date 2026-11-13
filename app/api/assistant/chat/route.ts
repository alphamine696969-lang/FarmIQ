import { NextRequest, NextResponse } from 'next/server';
import { generateAssistantResponse } from '@/lib/services/assistantService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body?.query || body?.message;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query string is required.',
          },
        },
        { status: 400 }
      );
    }

    const response = generateAssistantResponse(query);

    return NextResponse.json({
      data: response,
      meta: {
        retrievedAt: new Date().toISOString(),
        citationCount: response.citations.length,
        evidenceStatus: response.evidenceStatus,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing the agronomic query.',
        },
      },
      { status: 500 }
    );
  }
}
