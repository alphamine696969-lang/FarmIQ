import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('farmiq_google_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const raw = Buffer.from(sessionCookie, 'base64').toString('utf8');
    const user = JSON.parse(raw);
    return NextResponse.json({ authenticated: true, user });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false, user: null });
  res.cookies.delete('farmiq_google_session');
  return res;
}

