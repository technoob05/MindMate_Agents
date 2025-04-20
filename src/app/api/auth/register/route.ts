import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto'; // For generating unique IDs

// Define the path to the db.json file
const dbPath = path.join(process.cwd(), 'db.json');

// Define the structure of a user (adjust as needed)
interface User {
  id: string;
  email: string;
  hashedPassword?: string; // Store hashed password
  pseudonym?: string;
  // Add other fields if necessary, e.g., createdAt
}

// Define the structure of the database
interface Database {
  users: User[];
  chats: Record<string, any>; // Keep existing chat structure
}

// Helper function to read the database
async function readDb(): Promise<Database> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    // Ensure users array exists, default to empty if not
    const parsedData = JSON.parse(data) as Partial<Database>;
    return {
      users: parsedData.users || [],
      chats: parsedData.chats || {}, // Preserve existing chats
    };
  } catch (error: any) {
    // If file doesn't exist or is invalid JSON, return a default structure
    if (error.code === 'ENOENT') {
      console.log('db.json not found, returning default structure.');
      return { users: [], chats: {} };
    }
    console.error('Error reading db.json:', error);
    // Throw a more specific error or handle appropriately
    throw new Error('Could not read database file.');
  }
}

// Helper function to write to the database
async function writeDb(data: Database): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to db.json:', error);
    throw new Error('Could not write to database file.');
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, pseudonym } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const db = await readDb();

    // Check if user already exists
    const existingUser = db.users.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 }); // 409 Conflict
    }

    // Hash the password
    const saltRounds = 10; // Standard practice
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user object
    const newUser: User = {
      id: crypto.randomUUID(), // Generate a unique ID
      email,
      hashedPassword,
      pseudonym: pseudonym || undefined, // Store pseudonym if provided
    };

    // Add user to the database
    db.users.push(newUser);

    // Write updated database back to file
    await writeDb(db);

    // Return success response (don't send back the hashed password)
    const { hashedPassword: _, ...userToReturn } = newUser;
    return NextResponse.json({ message: 'User registered successfully', user: userToReturn }, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('Registration error:', error);
    // Distinguish between known errors (like file read/write) and unexpected errors
    if (error.message.includes('database file')) {
         return NextResponse.json({ message: 'Database operation failed' }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred during registration' }, { status: 500 });
  }
}
