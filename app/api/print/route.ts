import { NextResponse } from 'next/server';
import { getStylesBySrNums, getStylesBySrRange } from '@/lib/sheets';

function isAuthenticated(authHeader: string | null, authParam: string | null): boolean {
  const pin = process.env.TEAM_PIN;
  if (!pin) return false;
  const provided = authHeader?.replace('Bearer ', '') || authParam || '';
  return provided === pin;
}

/**
 * Parses Sr# range strings like:
 *   "1,4,5,6"   → [1, 4, 5, 6]
 *   "1:8"        → range 1–8
 *   "10:"        → range 10 onwards
 */
function parseRange(input: string): { type: 'list'; nums: number[] } | { type: 'range'; start: number; count: number } {
  const trimmed = input.trim();

  if (trimmed.includes(':')) {
    const [startStr, endStr] = trimmed.split(':');
    const start = parseInt(startStr.trim(), 10);
    if (endStr.trim() === '') {
      return { type: 'range', start, count: Infinity };
    }
    const end = parseInt(endStr.trim(), 10);
    return { type: 'range', start, count: end - start + 1 };
  }

  const nums = trimmed
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  return { type: 'list', nums };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rangeStr  = searchParams.get('range') || '';
  const authParam = searchParams.get('auth');
  const authHeader = request.headers.get('authorization');

  if (!rangeStr) {
    return NextResponse.json({ error: 'range parameter is required' }, { status: 400 });
  }

  const includePrivate = isAuthenticated(authHeader, authParam);
  const parsed = parseRange(rangeStr);

  let results;
  if (parsed.type === 'list') {
    results = await getStylesBySrNums(parsed.nums, includePrivate);
  } else {
    results = await getStylesBySrRange(parsed.start, parsed.count, includePrivate);
  }

  return NextResponse.json({ data: results, count: results.length, isTeamView: includePrivate });
}
