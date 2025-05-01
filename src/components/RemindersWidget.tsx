'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  scheduledTime: string; // ISO string format
  createdAt: string;
}

interface RemindersWidgetProps {
  userId: string | null;
  limit?: number;
  showTitle?: boolean;
}

const RemindersWidget: React.FC<RemindersWidgetProps> = ({ 
  userId, 
  limit = 3,
  showTitle = true
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchReminders();
    } else {
      // If userId is null, try to get it from sessionStorage
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          if (userData.id) {
            console.log('Found userId in sessionStorage:', userData.id);
            fetchReminders(userData.id);
          }
        } catch (err) {
          console.error("Failed to parse user data:", err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [userId]);

  const fetchReminders = async (overrideUserId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const idToUse = overrideUserId || userId;
      if (!idToUse) {
        console.warn('No userId available for fetching reminders');
        setReminders([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetching reminders for userId:', idToUse);
      const response = await fetch(`/api/reminders?userId=${idToUse}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }
      
      const data = await response.json();
      console.log('Reminders data received:', data);
      
      // Filter to only show upcoming reminders, but add a 1-minute buffer
      // to prevent reminders from disappearing too quickly
      const bufferTime = new Date();
      bufferTime.setMinutes(bufferTime.getMinutes() - 1); // 1 minute buffer
      
      const upcomingReminders = data.reminders.filter(
        (reminder: Reminder) => new Date(reminder.scheduledTime) > bufferTime
      );
      
      // Sort by date (nearest first) and limit the number
      const sortedReminders = upcomingReminders
        .sort((a: Reminder, b: Reminder) => 
          new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
        )
        .slice(0, limit);
      
      setReminders(sortedReminders);
      
      // Store the userId in localStorage to maintain consistency
      if (idToUse) {
        localStorage.setItem('mindmate_last_user_id', idToUse);
      }
      
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Could not load reminders');
    } finally {
      setLoading(false);
    }
  };

  // Set up interval to refresh reminders every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (userId) {
        fetchReminders();
      }
    }, 60000); // 60 seconds
    
    return () => clearInterval(intervalId);
  }, [userId]);

  // Helper function to format dates
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Determine time description (today, tomorrow, date)
  const getTimeDescription = (scheduledTime: string) => {
    const reminderDate = new Date(scheduledTime);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (reminderDate.toDateString() === now.toDateString()) {
      return <Badge variant="success">Hôm nay</Badge>;
    } else if (reminderDate.toDateString() === tomorrow.toDateString()) {
      return <Badge variant="warning">Ngày mai</Badge>;
    } else {
      return <Badge variant="secondary">{reminderDate.toLocaleDateString('vi-VN', {day: 'numeric', month: 'numeric'})}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Calendar className="mr-2 h-4 w-4" /> Lịch Nhắc Nhở
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-3 pt-2">
        {reminders.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Không có lịch nhắc nhở nào sắp tới
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="border rounded-md p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTimeDescription(reminder.scheduledTime)}
                        <h3 className="text-sm font-medium truncate">{reminder.title}</h3>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{formatDate(reminder.scheduledTime)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-4">
              <Link href="/reminders" passHref>
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  Xem tất cả
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RemindersWidget; 