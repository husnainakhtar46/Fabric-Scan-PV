import { NextResponse } from 'next/server';
import { searchStyles } from '@/lib/sheets';

function isAuthenticated(authHeader: string | null, authParam: string | null): boolean {
  const pin = process.env.TEAM_PIN;
  if (!pin) return false;
  const provided = authHeader?.replace('Bearer ', '') || authParam || '';
  return provided === pin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const authParam = searchParams.get('auth');
  const authHeader = request.headers.get('authorization');

  if (query.length < 1) {
    return NextResponse.json({ data: [], isTeamView: false });
  }

  const includePrivate = isAuthenticated(authHeader, authParam);
  try {
    const results = await searchStyles(query, includePrivate);
    return NextResponse.json({
      data: results,
      count: results.length,
      isTeamView: includePrivate,
    });
  } catch (err: any) {
    console.error("GOOGLE SHEETS CONNECTION ERROR:", err.message || err);
    return NextResponse.json({ 
      error: "Google Sheets Connection Error", 
      details: err.message || String(err) 
    }, { status: 500 });
  }
}
