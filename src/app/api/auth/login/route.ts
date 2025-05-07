import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { generateToken } from '@/lib/auth/jwt';

// Define the path to the db.json file
const dbPath = path.join(process.cwd(), 'db.json');

// Define the structure of a user (matching the registration route)
interface User {
  id: string;
  email: string;
  hashedPassword?: string; // Expect hashed password from db
  pseudonym?: string;
}

// Define the structure of the database
interface Database {
  users: User[];
  chats: Record<string, any>; // Keep existing chat structure
}

// Helper function to read the database (same as in register route)
async function readDb(): Promise<Database> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(data) as Partial<Database>;
    return {
      users: parsedData.users || [],
      chats: parsedData.chats || {},
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('db.json not found, returning default structure.');
      return { users: [], chats: {} };
    }
    console.error('Error reading db.json:', error);
    throw new Error('Could not read database file.');
  }
}

export async function POST(request: Request) {
  try {
    console.log('Login API called');
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    // Basic validation
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const db = await readDb();
    console.log('Database read, found users:', db.users.length);

    // Find user by email
    const user = db.users.find(u => u.email === email);

    if (!user || !user.hashedPassword) {
      // User not found or doesn't have a password (e.g., legacy data)
      console.log('User not found or no password');
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }); // 401 Unauthorized
    }

    console.log('User found:', user.email);

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }); // 401 Unauthorized
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    // Login successful
    const { hashedPassword: _, ...userToReturn } = user;
    console.log('Login successful, returning user:', userToReturn);

    // Create response with the user object
    const response = NextResponse.json(
      { message: 'Login successful', user: userToReturn },
      { status: 200 }
    );

    // Set JWT token in cookie
    response.cookies.set('sessionToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
     if (error.message.includes('database file')) {
         return NextResponse.json({ message: 'Database operation failed' }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred during login' }, { status: 500 });
  }
}
