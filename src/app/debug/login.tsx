'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestLoginPage() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [message, ...prev]);
    console.log(message);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    addLog(`Attempting login with email: ${email}`);
    
    // Clear any previous data
    localStorage.removeItem('user');
    localStorage.removeItem('redirectCount');
    localStorage.removeItem('lastLoginTime');
    
    addLog("Cleared localStorage");
    
    try {
      addLog("Sending login request to API...");
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      addLog(`Received response status: ${response.status}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (!data.user || !data.user.id) {
        throw new Error('Invalid user data received from server');
      }
      
      addLog(`Login successful, received user: ${JSON.stringify(data.user)}`);
      
      // Store in localStorage with different key to avoid conflicts
      localStorage.setItem('test_user', JSON.stringify(data.user));
      
      // Verify
      const storedUser = localStorage.getItem('test_user');
      
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          addLog(`Successfully stored and retrieved user from localStorage: id=${parsed.id}`);
          setResult("Login successful and localStorage working correctly");
        } catch (e) {
          addLog(`Error parsing stored user: ${e}`);
          throw new Error('Failed to parse stored user data');
        }
      } else {
        addLog('Failed to retrieve user from localStorage');
        throw new Error('Failed to store user data in localStorage');
      }
      
      // Try normal user storage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Verify normal user storage
      const normalUser = localStorage.getItem('user');
      
      if (normalUser) {
        addLog('Successfully stored user in normal "user" key');
      } else {
        addLog('Failed to store in normal "user" key');
      }
      
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto mb-6">
        <CardHeader>
          <CardTitle>Test Login Page</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {result && (
              <p className="text-sm text-green-500">{result}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Testing Login..." : "Test Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 font-mono p-2 rounded text-xs h-60 overflow-auto">
            {logs.map((log, i) => (
              <div key={i} className="py-1">{log}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 