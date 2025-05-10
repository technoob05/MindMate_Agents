'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestRedirectPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [message, ...prev]);
    console.log(message);
  };

  const goToHomepage = () => {
    addLog(`Redirecting to homepage (/) at ${new Date().toISOString()}`);
    window.location.href = '/';
  };

  const goToLogin = () => {
    addLog(`Redirecting to login at ${new Date().toISOString()}`);
    window.location.href = '/login';
  };

  const goToRegister = () => {
    addLog(`Redirecting to register at ${new Date().toISOString()}`);
    window.location.href = '/register';
  };

  const goToChatPage = () => {
    addLog(`Redirecting to chat at ${new Date().toISOString()}`);
    window.location.href = '/chat';
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    addLog(`Cleared localStorage at ${new Date().toISOString()}`);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Navigation Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={goToHomepage}>Go to Homepage (/)</Button>
            <Button onClick={goToLogin} variant="outline">Go to Login</Button>
            <Button onClick={goToRegister} variant="outline">Go to Register</Button>
            <Button onClick={goToChatPage} variant="outline">Go to Chat</Button>
            <Button onClick={clearLocalStorage} variant="destructive">Clear localStorage</Button>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">LocalStorage contents:</h3>
            <pre className="bg-muted p-2 rounded text-xs">
              {JSON.stringify(
                Object.keys(localStorage).reduce((acc, key) => {
                  return { ...acc, [key]: localStorage.getItem(key) };
                }, {}),
                null,
                2
              )}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-2 rounded h-40 overflow-auto text-xs">
            {logs.map((log, i) => (
              <div key={i} className="py-1 border-b border-border/20">{log}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 