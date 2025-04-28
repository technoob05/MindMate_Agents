import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the JSON database file
const dbPath = path.resolve(process.cwd(), 'db.json');

interface JournalEntry {
  id: string;
  userId: string;
  timestamp: number;
  prompt: string;
  entry: string;
  emotion: string;
  response: string;
  insight?: string;
  action?: string;
  quote?: string;
}

interface User {
  id: string;
  email: string;
  hashedPassword: string;
  pseudonym: string;
  chats: any[];
  journal: JournalEntry[];
}

interface DbData {
  users: User[];
  chats: {
    one_on_one: any[];
    ai_team: any[];
    multi_user: any[];
    multi_user_rooms: Record<string, any[]>;
  };
  journals: JournalEntry[];
}

// Helper function to read the database file
async function readDb(): Promise<DbData> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data) as DbData;
  } catch (error: any) {
    console.error('Error reading database file:', error);
    throw new Error('Could not read database');
  }
}

// Helper function to find user by ID
async function findUserById(userId: string): Promise<User | undefined> {
  const db = await readDb();
  return db.users.find(user => user.id === userId);
}

// Helper function to get the current user ID (simplified auth)
function getCurrentUserId(): string | null {
  // In a real app, this would be retrieved from the session or auth token
  // For demonstration, use a hardcoded value
  return "bf105534-29d9-4d1f-ba7a-b0822ac676fb"; // Hardcoded first user ID for demo
}

// GET handler to fetch journal entries for the current user
export async function GET() {
  try {
    const userId = getCurrentUserId();
    
    // If no user is authenticated, return empty array
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Find the user
    const user = await findUserById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return the journal entries from the user's journal array
    return NextResponse.json(user.journal);
  } catch (error: any) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entries', details: error.message },
      { status: 500 }
    );
  }
} 