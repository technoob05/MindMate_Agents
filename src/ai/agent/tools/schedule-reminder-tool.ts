import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";

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

// Type guard to ensure DB has reminders array
interface DbWithReminders {
  reminders: Reminder[];
  users: any[];
  chats: {
    one_on_one: any[];
    ai_team: any[];
    multi_user: any[];
  };
}

/**
 * Helper function to read the database file
 */
async function readDb(): Promise<DbWithReminders> {
  try {
    console.log(`Reading database from ${dbPath}`);
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(data);
    
    // Initialize reminders array if it doesn't exist
    if (!parsedData.reminders) {
      console.log('Reminders array not found in DB, initializing it');
      parsedData.reminders = [];
    } else {
      console.log(`Found ${parsedData.reminders.length} existing reminders in DB`);
    }
    
    return parsedData as DbWithReminders;
  } catch (error: any) {
    console.error('Error reading database file:', error);
    throw new Error('Không thể đọc cơ sở dữ liệu');
  }
}

/**
 * Helper function to write to the database file
 */
async function writeDb(data: DbWithReminders): Promise<void> {
  try {
    console.log(`Writing updated database with ${data.reminders.length} reminders`);
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
    console.log('Database write successful');
  } catch (error) {
    console.error('Error writing to database file:', error);
    throw new Error('Không thể ghi vào cơ sở dữ liệu');
  }
}

/**
 * Helper function to parse various date/time formats into ISO string
 */
function parseScheduledTime(timeString: string): string | null {
  console.log(`Attempting to parse time string: ${timeString}`);
  
  // If already in ISO format, return as is
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(timeString)) {
    console.log('Input is already in ISO format');
    return timeString;
  }
  
  // Try parsing Vietnamese date formats
  // Format examples:
  // "8 giờ sáng mai" (8 AM tomorrow)
  // "15:30 ngày 20/7/2024" (3:30 PM on July 20, 2024)
  // "20/7/2024 lúc 15:30" (July 20, 2024 at 3:30 PM)
  // "sáng ngày mai lúc 8 giờ" (8 AM tomorrow morning)

  const now = new Date();
  let scheduledDate: Date | null = null;
  
  try {
    // Natural language patterns in Vietnamese
    if (timeString.includes('mai') || timeString.includes('tomorrow')) {
      console.log('Detected reference to tomorrow');
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Reset time to beginning of day
      tomorrow.setHours(0, 0, 0, 0);
      
      // Extract time component if present
      if (timeString.includes('giờ') || timeString.includes(':')) {
        // Extract hour
        const hourMatch = timeString.match(/(\d{1,2})\s*(giờ|:)/);
        if (hourMatch) {
          const hour = parseInt(hourMatch[1]);
          
          // Determine AM/PM
          const isPM = timeString.includes('chiều') || 
                        timeString.includes('tối') || 
                        timeString.includes('PM') || 
                        timeString.includes('pm');
          
          // Set hours (convert to 24-hour format if needed)
          tomorrow.setHours(isPM && hour < 12 ? hour + 12 : hour);
          
          // Extract minutes if present
          const minuteMatch = timeString.match(/:(\d{1,2})/);
          if (minuteMatch) {
            tomorrow.setMinutes(parseInt(minuteMatch[1]));
          }
        }
      }
      
      scheduledDate = tomorrow;
    }
    // Handle date patterns like DD/MM/YYYY or MM/DD/YYYY
    else if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(timeString)) {
      console.log('Detected date in DD/MM/YYYY or MM/DD/YYYY format');
      
      // Extract date components
      const dateMatch = timeString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        // In Vietnam, the format is typically DD/MM/YYYY
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1; // Months are 0-indexed in JS
        const year = parseInt(dateMatch[3]);
        
        scheduledDate = new Date(year, month, day);
        
        // Extract time if present
        if (timeString.includes('giờ') || timeString.includes(':')) {
          const hourMatch = timeString.match(/(\d{1,2})\s*(giờ|:)/);
          if (hourMatch) {
            const hour = parseInt(hourMatch[1]);
            const isPM = timeString.includes('chiều') || 
                          timeString.includes('tối') || 
                          timeString.includes('PM') || 
                          timeString.includes('pm');
            
            scheduledDate.setHours(isPM && hour < 12 ? hour + 12 : hour);
            
            const minuteMatch = timeString.match(/:(\d{1,2})/);
            if (minuteMatch) {
              scheduledDate.setMinutes(parseInt(minuteMatch[1]));
            }
          }
        }
      }
    }
    
    // If no specific pattern matched but we have a date
    if (scheduledDate === null) {
      console.log('No specific pattern matched, trying Date.parse()');
      const timestamp = Date.parse(timeString);
      if (!isNaN(timestamp)) {
        scheduledDate = new Date(timestamp);
      }
    }
    
    // Return ISO string if we successfully parsed the date
    if (scheduledDate && !isNaN(scheduledDate.getTime())) {
      console.log(`Successfully parsed date: ${scheduledDate.toISOString()}`);
      return scheduledDate.toISOString();
    }
    
    console.log('Failed to parse time string');
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Tool for scheduling reminders
 */
export const scheduleReminderTool = new DynamicStructuredTool({
  name: "schedule_activity_reminder",
  description: "Đặt lịch nhắc nhở cho người dùng. Chỉ sử dụng công cụ này khi người dùng yêu cầu rõ ràng về việc đặt nhắc nhở, lên lịch, hoặc nhắc nhở họ về một hoạt động cụ thể vào thời điểm nào đó. userId PHẢI được lấy từ System note trong tin nhắn - không tự tạo hoặc đoán.",
  schema: z.object({
    userId: z.string().describe("ID của người dùng cần đặt nhắc nhở. PHẢI lấy từ System note trong tin nhắn, định dạng '[System note: Current userId is \"xxx\"...]'."),
    title: z.string().describe("Tiêu đề ngắn gọn cho nhắc nhở."),
    description: z.string().describe("Mô tả chi tiết về nhắc nhở, bao gồm thông tin về hoạt động."),
    scheduledTime: z.string().describe("Thời gian lên lịch cho nhắc nhở. Có thể là định dạng ISO (ví dụ: '2024-07-30T10:00:00') hoặc mô tả tự nhiên như '8 giờ sáng mai', '15:30 ngày 20/7/2024'."),
  }),
  func: async ({ userId, title, description, scheduledTime }) => {
    console.log(`Schedule reminder tool called with params: userId=${userId}, title=${title}, scheduledTime=${scheduledTime}`);
    
    try {
      // Kiểm tra userId có hợp lệ không
      if (!userId || userId.trim() === '') {
        console.error('INVALID userId provided: empty or undefined');
        return "Không thể tạo nhắc nhở vì userId không hợp lệ. Vui lòng cung cấp userId từ System note.";
      }
      
      // Parse the timestamp using our enhanced parser
      console.log(`Parsing timestamp: ${scheduledTime}`);
      const parsedTime = parseScheduledTime(scheduledTime);
      
      if (!parsedTime) {
        console.log('Invalid timestamp format');
        return "Không thể nhận diện định dạng thời gian. Vui lòng cung cấp thời gian cụ thể hơn (ví dụ: '8 giờ sáng mai', '15:30 ngày 20/7/2024').";
      }
      
      // Validate that the scheduled time is in the future
      const scheduledDate = new Date(parsedTime);
      const now = new Date();
      
      if (scheduledDate <= now) {
        console.log('Scheduled time is in the past');
        return "Thời gian đặt lịch phải là thời gian trong tương lai. Vui lòng chọn thời gian sau thời điểm hiện tại.";
      }
      
      // Read database
      console.log('Reading database for reminder creation');
      const db = await readDb();
      
      // Create new reminder
      const reminderId = crypto.randomUUID();
      console.log(`Generated new reminder ID: ${reminderId}`);
      
      const reminder: Reminder = {
        id: reminderId,
        userId,
        title,
        description,
        scheduledTime: parsedTime,
        createdAt: new Date().toISOString(),
      };
      
      // Log the full reminder object for debugging
      console.log('New reminder object:', JSON.stringify(reminder, null, 2));
      
      // Add to database
      console.log(`Adding new reminder with ID: ${reminder.id} for user ${reminder.userId}`);
      db.reminders.push(reminder);
      
      // Log database state before saving
      console.log(`Database now has ${db.reminders.length} reminders total`);
      
      // Save to database
      await writeDb(db);
      console.log('Database successfully updated with new reminder');
      
      // Store userId in localStorage as backup
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('mindmate_last_user_id', userId);
          console.log(`Stored userId ${userId} in localStorage for backup`);
        }
      } catch (e) {
        console.warn('Could not store userId in localStorage:', e);
      }
      
      // Return confirmation with user-friendly date formatting
      const formattedDate = new Date(parsedTime).toLocaleString('vi-VN', {
        dateStyle: 'full',
        timeStyle: 'short',
      });
      
      console.log(`Successfully scheduled reminder for: ${formattedDate}`);
      return `Đã đặt lịch nhắc nhở "${title}" thành công cho ${formattedDate}. Tôi sẽ nhắc bạn vào đúng thời điểm đã hẹn.`;
    } catch (error) {
      console.error("Error scheduling reminder:", error);
      // Return a more specific error message based on the type of error
      if (error instanceof Error) {
        return `Đã xảy ra lỗi khi đặt lịch nhắc nhở: ${error.message}`;
      }
      return "Đã xảy ra lỗi khi đặt lịch nhắc nhở. Vui lòng thử lại sau.";
    }
  },
}); 