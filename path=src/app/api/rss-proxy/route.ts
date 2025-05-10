import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch RSS feed: ${response.status}` },
        { status: response.status }
      );
    }

    const xmlText = await response.text();

    return new NextResponse(xmlText, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return NextResponse.json({ error: 'Failed to fetch RSS feed' }, { status: 500 });
  }
} 