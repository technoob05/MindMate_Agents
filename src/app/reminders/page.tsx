'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, Trash2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  scheduledTime: string; // ISO string format
  createdAt: string;
}

const RemindersPage = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID from localStorage on component mount
  useEffect(() => {
    // Thử lấy userId từ sessionStorage trước
    const userStr = sessionStorage.getItem('user');
    let storedUserId = null;
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        storedUserId = userData.id;
        console.log('Using userId from sessionStorage:', storedUserId);
        setUserId(storedUserId);
      } catch (err) {
        console.error("Failed to parse user data:", err);
      }
    }
    
    // Nếu không có trong sessionStorage, thử lấy từ localStorage backup
    if (!storedUserId) {
      const backupUserId = localStorage.getItem('mindmate_last_user_id');
      if (backupUserId) {
        console.log('Using backup userId from localStorage:', backupUserId);
        setUserId(backupUserId);
      } else {
        // Generate a temporary user ID if none exists
        const tempId = 'user-' + Math.random().toString(36).substring(2, 9);
        console.log('Creating temporary userId:', tempId);
        setUserId(tempId);
        localStorage.setItem('mindmate_last_user_id', tempId);
      }
    }
  }, []);

  // Fetch reminders when userId changes
  useEffect(() => {
    if (userId) {
      fetchReminders();
    }
  }, [userId]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userId) {
        console.warn('No userId available for fetching reminders');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching reminders for userId: ${userId}`);
      const response = await fetch(`/api/reminders?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }
      
      const data = await response.json();
      console.log(`Retrieved ${data.reminders?.length || 0} reminders`);
      
      // If no reminders found for current userId and using a temporary ID, 
      // try to fetch with a fallback mechanism
      if (data.reminders?.length === 0 && userId?.startsWith('user-')) {
        console.log('No reminders found with temp userId, trying fallback fetch...');
        const fallbackResponse = await fetch(`/api/reminders/all`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.reminders?.length > 0) {
            console.log(`Found ${fallbackData.reminders.length} reminders from fallback method`);
            setReminders(fallbackData.reminders);
            setLoading(false);
            return;
          }
        }
      }
      
      setReminders(data.reminders);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Không thể tải lịch nhắc nhở. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const response = await fetch(`/api/reminders?id=${id}&userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete reminder');
      }
      
      // Remove the deleted reminder from state
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError('Could not delete the reminder. Please try again.');
    }
  };

  // Helper function to format dates
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Helper function to check if a reminder is in the past
  const isPastReminder = (scheduledTime: string) => {
    return new Date(scheduledTime) < new Date();
  };

  // Filter reminders based on active tab
  const filteredReminders = reminders.filter(reminder => {
    if (activeTab === 'upcoming') {
      return !isPastReminder(reminder.scheduledTime);
    } else if (activeTab === 'past') {
      return isPastReminder(reminder.scheduledTime);
    }
    return true; // 'all' tab
  });

  // Determine time description (today, tomorrow, date)
  const getTimeDescription = (scheduledTime: string) => {
    const reminderDate = new Date(scheduledTime);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if date is today
    if (reminderDate.toDateString() === now.toDateString()) {
      return <Badge variant="success">Hôm nay</Badge>;
    } 
    // Check if date is tomorrow
    else if (reminderDate.toDateString() === tomorrow.toDateString()) {
      return <Badge variant="warning">Ngày mai</Badge>;
    } 
    // Past date
    else if (reminderDate < now) {
      return <Badge variant="destructive">Đã qua</Badge>;
    }
    // Future date
    else {
      return <Badge variant="secondary">{reminderDate.toLocaleDateString('vi-VN')}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center">
              <Calendar className="mr-2 h-6 w-6" /> Lịch Nhắc Nhở
            </CardTitle>
            <CardDescription>Xem và quản lý các lịch hẹn và nhắc nhở của bạn</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Sắp tới</TabsTrigger>
                <TabsTrigger value="past">Đã qua</TabsTrigger>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                {loading ? (
                  <div className="flex justify-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center p-6 text-destructive">
                    <Info className="h-8 w-8 mx-auto mb-2" />
                    <p>{error}</p>
                  </div>
                ) : filteredReminders.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-muted/30">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">Không có lịch nhắc nhở</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {activeTab === 'upcoming' ? 
                        'Bạn chưa có lịch nhắc nhở nào sắp tới. Hãy trò chuyện với MindMate để thiết lập các lịch nhắc nhở cho các hoạt động.' :
                        'Không tìm thấy lịch nhắc nhở nào trong khoảng thời gian này.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReminders.map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card>
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getTimeDescription(reminder.scheduledTime)}
                                  <h3 className="text-lg font-medium">{reminder.title}</h3>
                                </div>
                                <p className="text-muted-foreground mb-3">{reminder.description}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{formatDate(reminder.scheduledTime)}</span>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => deleteReminder(reminder.id)}
                                title="Xóa nhắc nhở này"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="outline" onClick={fetchReminders}>
              Làm mới
            </Button>
            <Button variant="gradient" onClick={() => window.location.href = '/chat'}>
              Trò chuyện với MindMate
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default RemindersPage; 