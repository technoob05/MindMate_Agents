import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured on server.' }, { status: 500 });
  }

  return NextResponse.json({ apiKey });
}
