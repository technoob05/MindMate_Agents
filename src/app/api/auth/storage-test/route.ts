import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const timestamp = new Date().toISOString();
    const testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      pseudonym: 'TestUser',
      timestamp
    };
    
    return NextResponse.json({
      message: 'Test user data for storage testing',
      user: testUser
    });
  } catch (error: any) {
    console.error('Storage test error:', error);
    return NextResponse.json({ message: 'Error in storage test' }, { status: 500 });
  }
} 