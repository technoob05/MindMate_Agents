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

// GET handler to fetch all reminders 
export async function GET() {
  try {
    const db = await readDb();
    
    // Get all reminders in the system
    const allReminders = db.reminders;
    
    // Sort reminders by scheduled time (nearest first)
    allReminders.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
    
    // Only return upcoming reminders (those in the future)
    const upcomingReminders = allReminders.filter(reminder => 
      new Date(reminder.scheduledTime) > new Date()
    );
    
    console.log(`Returning ${upcomingReminders.length} upcoming reminders from total ${allReminders.length}`);
    
    return NextResponse.json({ reminders: upcomingReminders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching reminders', reminders: [] }, { status: 500 });
  }
} 