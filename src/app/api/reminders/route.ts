import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the JSON database file
const dbPath = path.resolve(process.cwd(), 'db.json');

// Interface for reminders
interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  scheduledTime: string; // ISO string format
  createdAt: string;
}

interface DbData {
  users: any[];
  chats: {
    one_on_one: any[];
    ai_team: any[];
    multi_user: any[];
  };
  reminders: Reminder[];
}

// Helper function to read the database file
async function readDb(): Promise<DbData> {
  try {
    console.log(`Reading database from ${dbPath}`);
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(data) as DbData;
    
    // Initialize reminders array if it doesn't exist
    if (!parsedData.reminders) {
      console.log('Reminders array not found in DB, initializing it');
      parsedData.reminders = [];
    } else {
      console.log(`Found ${parsedData.reminders.length} existing reminders in DB`);
    }
    
    return parsedData;
  } catch (error: any) {
    // If the file doesn't exist or is empty, return a default structure
    if (error.code === 'ENOENT') {
      const defaultData: DbData = { 
        users: [], 
        chats: { one_on_one: [], ai_team: [], multi_user: [] },
        reminders: []
      };
      await fs.writeFile(dbPath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    console.error('Error reading database file:', error);
    throw new Error('Could not read database');
  }
}

// GET handler to fetch reminders for the current user
export async function GET(request: Request) {
  try {
    // Extract user ID from the query parameter
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // If no user ID provided, return empty array
    if (!userId) {
      return NextResponse.json({ reminders: [] });
    }

    const db = await readDb();
    
    // Filter reminders to only return those belonging to the current user
    const userReminders = db.reminders.filter(reminder => 
      reminder.userId === userId
    );
    
    // Sort reminders by scheduled time (nearest first)
    userReminders.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
    
    return NextResponse.json({ reminders: userReminders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching reminders', reminders: [] }, { status: 500 });
  }
}

// DELETE handler to remove a reminder
export async function DELETE(request: Request) {
  try {
    // Extract reminder ID from the query parameter
    const url = new URL(request.url);
    const reminderId = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    
    // If no reminder ID provided, return error
    if (!reminderId) {
      return NextResponse.json({ message: 'No reminder ID provided' }, { status: 400 });
    }
    
    // If no user ID provided, return error
    if (!userId) {
      return NextResponse.json({ message: 'No user ID provided' }, { status: 400 });
    }

    const db = await readDb();
    
    // Find the reminder index
    const reminderIndex = db.reminders.findIndex(r => 
      r.id === reminderId && r.userId === userId
    );
    
    // If reminder not found, return error
    if (reminderIndex === -1) {
      return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }
    
    // Remove the reminder
    db.reminders.splice(reminderIndex, 1);
    
    // Save the updated database
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error deleting reminder' }, { status: 500 });
  }
} 