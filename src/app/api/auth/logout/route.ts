import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear the session token cookie
    response.cookies.delete('sessionToken');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'An error occurred during logout' }, { status: 500 });
  }
} 