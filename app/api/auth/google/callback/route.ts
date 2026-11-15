import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateRaw = searchParams.get('state');

  let returnTo = '/app';
  let expectedRedirectUri = '';

  if (stateRaw) {
    try {
      const decoded = JSON.parse(Buffer.from(stateRaw, 'base64').toString('utf8'));
      if (decoded.returnTo) returnTo = decoded.returnTo;
      if (decoded.redirectUri) expectedRedirectUri = decoded.redirectUri;
    } catch {
      // Keep defaults
    }
  }

  if (error) {
    console.error('Google OAuth error from callback:', error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_authorization_code', req.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Google OAuth credentials missing on server');
    return NextResponse.redirect(
      new URL('/login?error=missing_server_credentials', req.url)
    );
  }

  // Determine redirect URI
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const redirectUri = expectedRedirectUri || `${appUrl}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Failed to exchange Google OAuth code:', tokenRes.status, errBody);
      return NextResponse.redirect(
        new URL(`/login?error=token_exchange_failed&details=${encodeURIComponent(errBody)}`, req.url)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch verified Google user profile using access token
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      console.error('Failed to fetch userinfo from Google');
      return NextResponse.redirect(
        new URL('/login?error=userinfo_fetch_failed', req.url)
      );
    }

    const googleUser = await userRes.json();

    // 3. Create user session payload
    const authPayload = {
      sub: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      givenName: googleUser.given_name,
      familyName: googleUser.family_name,
      picture: googleUser.picture,
      emailVerified: googleUser.email_verified,
      authenticatedAt: new Date().toISOString(),
    };

    const encodedPayload = Buffer.from(JSON.stringify(authPayload)).toString('base64');

    // 4. Redirect to returnTo with cookie and URL param for seamless client hydration
    const destinationUrl = new URL(returnTo, req.url);
    destinationUrl.searchParams.set('google_auth', '1');

    const response = NextResponse.redirect(destinationUrl);

    // Set secure session cookie readable by client
    response.cookies.set('farmiq_google_session', encodedPayload, {
      path: '/',
      httpOnly: false, // Accessible to client-side userState sync
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Unhandled error during Google callback:', err);
    return NextResponse.redirect(
      new URL(`/login?error=server_error&msg=${encodeURIComponent(err.message || 'unknown')}`, req.url)
    );
  }
}

