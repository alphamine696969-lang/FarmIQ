import { NextRequest, NextResponse } from 'next/server';

interface GoogleTokenInfo {
  iss?: string;
  sub?: string;
  azp?: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  error_description?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { credential, accessToken } = await req.json();

    if (!credential && !accessToken) {
      return NextResponse.json(
        { error: 'Either credential (ID token) or accessToken must be provided' },
        { status: 400 }
      );
    }

    // If ID Token (JWT) is provided, verify with Google's tokeninfo API
    if (credential) {
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );

      if (!googleRes.ok) {
        const errorData = await googleRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: 'Invalid Google credential token', details: errorData },
          { status: 401 }
        );
      }

      const info: GoogleTokenInfo = await googleRes.json();

      return NextResponse.json({
        verified: true,
        user: {
          sub: info.sub,
          email: info.email,
          emailVerified: info.email_verified === 'true' || info.email_verified === true,
          name: info.name,
          givenName: info.given_name,
          familyName: info.family_name,
          picture: info.picture,
        },
      });
    }

    // If OAuth2 Access Token is provided, fetch userinfo from Google's UserInfo API
    if (accessToken) {
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!googleRes.ok) {
        return NextResponse.json(
          { error: 'Invalid Google access token' },
          { status: 401 }
        );
      }

      const info = await googleRes.json();

      return NextResponse.json({
        verified: true,
        user: {
          sub: info.sub,
          email: info.email,
          emailVerified: info.email_verified === true,
          name: info.name,
          givenName: info.given_name,
          familyName: info.family_name,
          picture: info.picture,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported request' }, { status: 400 });
  } catch (error) {
    console.error('Error verifying Google auth:', error);
    return NextResponse.json(
      { error: 'Internal server error during Google verification' },
      { status: 500 }
    );
  }
}

