import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const envPin = process.env.TEAM_PIN;
    if (envPin && pin === envPin) {
      return NextResponse.json({ success: true, isTeamView: true });
    }
    return NextResponse.json({ success: false, error: 'Incorrect PIN' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
