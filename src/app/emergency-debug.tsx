'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function EmergencyDebugPage() {
  const [message, setMessage] = useState('Emergency Debug Access');
  const [authStatus, setAuthStatus] = useState<string>('');

  useEffect(() => {
    try {
      // Get current auth state
      const user = localStorage.getItem('user');
      const redirectCount = localStorage.getItem('redirectCount');
      setAuthStatus(JSON.stringify({
        hasUser: !!user,
        user: user ? JSON.parse(user) : null,
        redirectCount
      }, null, 2));
    } catch (e) {
      setAuthStatus(`Error checking auth: ${e}`);
    }
  }, []);

  const createTemporaryUser = () => {
    try {
      // Create a temporary debug user
      const tempUser = {
        id: 'emergency-debug-' + Date.now(),
        email: 'emergency@debug.com',
        pseudonym: 'Emergency Debug'
      };
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(tempUser));
      
      // Reset redirect counter
      localStorage.removeItem('redirectCount');
      
      // Set last auth time
      localStorage.setItem('lastAuthTime', Date.now().toString());
      
      setMessage('User created successfully!');
      
      // Refresh status
      const user = localStorage.getItem('user');
      setAuthStatus(JSON.stringify({
        hasUser: !!user,
        user: user ? JSON.parse(user) : null,
        redirectCount: localStorage.getItem('redirectCount')
      }, null, 2));
    } catch (e) {
      setMessage(`Error: ${e}`);
    }
  };

  const goToPage = (path: string) => {
    window.location.href = path;
  };

  const clearAuth = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('redirectCount');
      localStorage.removeItem('lastAuthTime');
      setMessage('Auth data cleared');
      
      // Refresh status
      setAuthStatus(JSON.stringify({
        hasUser: false,
        user: null,
        redirectCount: null
      }, null, 2));
    } catch (e) {
      setMessage(`Error: ${e}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
          {message}
        </h1>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Authentication Status:</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-40">
            {authStatus}
          </pre>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={createTemporaryUser}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Create Emergency User
          </Button>
          
          <Button 
            onClick={() => goToPage('/')}
            className="w-full"
          >
            Go to Home Page
          </Button>
          
          <Button 
            onClick={() => goToPage('/debug/fix-login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Debug Page
          </Button>
          
          <Button 
            onClick={clearAuth}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Clear Auth Data
          </Button>
        </div>
      </div>
    </div>
  );
} 