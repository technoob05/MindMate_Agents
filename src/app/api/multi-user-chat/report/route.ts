import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the JSON database file (relative to CWD)
const dbPath = path.resolve(process.cwd(), 'db.json');

// Define structure for reports (matching the main route)
interface Report {
    reportId: string;
    messageId: string;
    roomId: string;
    reporterUserId: string;
    timestamp: number;
    reason?: string; // Optional reason from user (can be added later)
    status: 'pending' | 'reviewed' | 'action_taken';
}

// Define the expected structure of the database file (matching the main route)
interface MultiUserMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  roomId: string;
  isModerated?: boolean;
  moderationAction?: string;
}

interface DbData {
  users: any[];
  chats: {
    one_on_one: any[];
    ai_team: any[];
    multi_user_rooms: { [roomId: string]: MultiUserMessage[] };
  };
  reports: Report[];
}

// --- Database Helper Functions (Copied from main route - Consider shared lib) ---
async function readDb(): Promise<DbData> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(data);
    // Ensure default structures exist
    parsedData.users = parsedData.users || [];
    parsedData.chats = parsedData.chats || {};
    parsedData.chats.one_on_one = parsedData.chats.one_on_one || [];
    parsedData.chats.ai_team = parsedData.chats.ai_team || [];
    parsedData.chats.multi_user_rooms = parsedData.chats.multi_user_rooms || {};
    parsedData.reports = parsedData.reports || [];
    return parsedData as DbData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      const defaultData: DbData = {
          users: [],
          chats: { one_on_one: [], ai_team: [], multi_user_rooms: {} },
          reports: []
      };
      await writeDb(defaultData);
      return defaultData;
    }
    console.error('Error reading database file:', error);
    throw new Error('Could not read database');
  }
}

async function writeDb(data: DbData): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database file:', error);
    throw new Error('Could not write to database');
  }
}
// --- End Database Helper Functions ---

// POST handler for reporting a message
export async function POST(request: Request) {
  try {
    const reportInput: { messageId: string; roomId: string; reporterUserId: string } = await request.json();

    if (!reportInput || !reportInput.messageId || !reportInput.roomId || !reportInput.reporterUserId) {
      return NextResponse.json({ message: 'Invalid report format: messageId, roomId, and reporterUserId required' }, { status: 400 });
    }

    const db = await readDb();

    // Optional: Check if the message actually exists in that room (for robustness)
    const roomMessages = db.chats.multi_user_rooms[reportInput.roomId] || [];
    const messageExists = roomMessages.some(msg => msg.id === reportInput.messageId);
    if (!messageExists) {
        console.warn(`Attempted to report non-existent message ID ${reportInput.messageId} in room ${reportInput.roomId}`);
        // Decide whether to still record the report or return an error
        // return NextResponse.json({ message: 'Message not found in the specified room' }, { status: 404 });
    }

    // Optional: Check if this user has already reported this message
    const alreadyReported = db.reports.some(
        report => report.messageId === reportInput.messageId && report.reporterUserId === reportInput.reporterUserId
    );
    if (alreadyReported) {
        console.log(`User ${reportInput.reporterUserId} already reported message ${reportInput.messageId}`);
        return NextResponse.json({ message: 'You have already reported this message.' }, { status: 409 }); // Conflict
    }


    const newReport: Report = {
      reportId: crypto.randomUUID(),
      messageId: reportInput.messageId,
      roomId: reportInput.roomId,
      reporterUserId: reportInput.reporterUserId,
      timestamp: Date.now(),
      status: 'pending', // Initial status
    };

    db.reports.push(newReport);
    await writeDb(db);

    console.log(`Message ${newReport.messageId} reported by ${newReport.reporterUserId} in room ${newReport.roomId}. Report ID: ${newReport.reportId}`);

    // Return success response
    return NextResponse.json({ message: 'Message reported successfully.', reportId: newReport.reportId }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/multi-user-chat/report:', error);
    return NextResponse.json({ message: error.message || 'Error processing report request' }, { status: 500 });
  }
}
