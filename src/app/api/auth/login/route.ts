import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

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
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const db = await readDb();

    // Find user by email
    const user = db.users.find(u => u.email === email);

    if (!user || !user.hashedPassword) {
      // User not found or doesn't have a password (e.g., legacy data)
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }); // 401 Unauthorized
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }); // 401 Unauthorized
    }

    // Login successful
    // In a real app, you would generate a session token (e.g., JWT) here
    // For this demo, just return success and user info (without password)
    const { hashedPassword: _, ...userToReturn } = user;
    return NextResponse.json({ message: 'Login successful', user: userToReturn }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
     if (error.message.includes('database file')) {
         return NextResponse.json({ message: 'Database operation failed' }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred during login' }, { status: 500 });
  }
}
