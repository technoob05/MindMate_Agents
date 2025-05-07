'use client';

import { useEffect, useState } from 'react';

export default function ForceLoginDebugPage() {
  const [message, setMessage] = useState('Creating temporary user...');

  useEffect(() => {
    try {
      // Create a temporary debug user
      const tempUser = {
        id: 'debug-' + Date.now(),
        email: 'debug@test.com',
        pseudonym: 'Debugger'
      };
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(tempUser));
      
      // Reset redirect counter
      localStorage.removeItem('redirectCount');
      
      // Set last auth time
      localStorage.setItem('lastAuthTime', Date.now().toString());
      
      setMessage('User created, redirecting to debug page...');
      
      // Redirect directly to fix-login page
      setTimeout(() => {
        window.location.href = '/debug/fix-login';
      }, 1000);
    } catch (e) {
      setMessage(`Error: ${e}`);
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md">
        {message}
      </div>
    </div>
  );
} 