import { NextResponse } from 'next/server';
import { getStyleByRef } from '@/lib/sheets';

function isAuthenticated(authHeader: string | null, authParam: string | null): boolean {
  const pin = process.env.TEAM_PIN;
  if (!pin) return false;
  const provided = authHeader?.replace('Bearer ', '') || authParam || '';
  return provided === pin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const styleRef = searchParams.get('styleRef');
  const authParam = searchParams.get('auth');
  const authHeader = request.headers.get('authorization');

  if (!styleRef) {
    return NextResponse.json({ error: 'styleRef is required' }, { status: 400 });
  }

  const includePrivate = isAuthenticated(authHeader, authParam);
  try {
    const garment = await getStyleByRef(styleRef, includePrivate);
    if (!garment) {
      return NextResponse.json({ error: 'Style not found', styleRef }, { status: 404 });
    }
    return NextResponse.json({
      data: garment,
      isTeamView: includePrivate,
    });
  } catch (err: any) {
    console.error("GOOGLE SHEETS CONNECTION ERROR (STYLE):", err.message || err);
    return NextResponse.json({ 
      error: "Google Sheets Connection Error", 
      details: err.message || String(err) 
    }, { status: 500 });
  }
}
