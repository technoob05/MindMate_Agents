'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function DebugIndexPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check current authentication status
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUserInfo(JSON.parse(userData));
      }
      
      // Get all localStorage items
      const items: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key) || '';
        }
      }
      setLocalStorageItems(items);
    } catch (e) {
      console.error('Error checking auth status:', e);
    }
  }, []);

  // Simple direct navigation function
  const goToPage = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Debug Tools</CardTitle>
          <CardDescription>
            Access various debug tools for the MindMate application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <Button 
              onClick={() => goToPage('/debug/force-login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Force Login Tool
            </Button>
            
            <Button 
              onClick={() => goToPage('/debug/fix-login')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Fix Login Issues
            </Button>
            
            <Button 
              onClick={() => goToPage('/emergency-debug')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              Emergency Debug
            </Button>
            
            <Button 
              onClick={() => goToPage('/')}
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">
            <p className="font-semibold mb-2">Current Authentication Status:</p>
            {userInfo ? (
              <div>
                <p>User: {userInfo.email || userInfo.id}</p>
                <p>Pseudonym: {userInfo.pseudonym || 'Not set'}</p>
              </div>
            ) : (
              <p>No user authenticated</p>
            )}
          </div>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">
            <p className="font-semibold mb-2">Local Storage Items:</p>
            {Object.keys(localStorageItems).length > 0 ? (
              <pre className="overflow-auto max-h-40">
                {JSON.stringify(localStorageItems, null, 2)}
              </pre>
            ) : (
              <p>No items in localStorage</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 