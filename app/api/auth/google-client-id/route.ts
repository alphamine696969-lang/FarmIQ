import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GOOGLE_CLIENT_ID_KEY = 'NEXT_PUBLIC_GOOGLE_CLIENT_ID';

export async function GET() {
  const clientId = process.env[GOOGLE_CLIENT_ID_KEY] || '';
  return NextResponse.json({
    configured: Boolean(clientId && clientId.trim().length > 0),
    clientId: clientId || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawClientId = body?.clientId;

    if (rawClientId === undefined || typeof rawClientId !== 'string') {
      return NextResponse.json(
        { error: 'clientId is required and must be a string' },
        { status: 400 }
      );
    }

    const clientId = rawClientId.trim();

    // Update in-memory environment variable dynamically without webpack string replacement
    process.env[GOOGLE_CLIENT_ID_KEY] = clientId;

    // Persist to .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const clientRegex = /^NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*$/m;
    if (clientRegex.test(envContent)) {
      envContent = envContent.replace(clientRegex, `NEXT_PUBLIC_GOOGLE_CLIENT_ID="${clientId}"`);
    } else {
      envContent += `\nNEXT_PUBLIC_GOOGLE_CLIENT_ID="${clientId}"\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    return NextResponse.json({
      success: true,
      configured: true,
      clientId,
      message: 'Google Client ID saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving Google Client ID:', error);
    return NextResponse.json(
      { error: 'Failed to save Google Client ID: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
