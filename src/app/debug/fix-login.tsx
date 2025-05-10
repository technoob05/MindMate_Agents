'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FixLoginPage() {
  const [userData, setUserData] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [navigateTo, setNavigateTo] = useState<string>('/');
  
  useEffect(() => {
    try {
      // Get current localStorage state
      const user = localStorage.getItem('user');
      const redirectCount = localStorage.getItem('redirectCount');
      const lastAuthTime = localStorage.getItem('lastAuthTime');
      const onboardingComplete = localStorage.getItem('mindmateOnboardingComplete');
      
      // Display current state
      setUserData(JSON.stringify({
        user: user ? JSON.parse(user) : null,
        redirectCount,
        lastAuthTime,
        onboardingComplete
      }, null, 2));
    } catch (e) {
      setUserData(`Error accessing localStorage: ${e}`);
    }
  }, []);
  
  const resetRedirectCounter = () => {
    try {
      localStorage.removeItem('redirectCount');
      setStatus('Redirect counter reset successfully');
      
      // Refresh displayed data
      const user = localStorage.getItem('user');
      const redirectCount = localStorage.getItem('redirectCount');
      const lastAuthTime = localStorage.getItem('lastAuthTime');
      const onboardingComplete = localStorage.getItem('mindmateOnboardingComplete');
      
      setUserData(JSON.stringify({
        user: user ? JSON.parse(user) : null,
        redirectCount,
        lastAuthTime,
        onboardingComplete
      }, null, 2));
    } catch (e) {
      setStatus(`Error: ${e}`);
    }
  };
  
  const resetAllAuthData = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('redirectCount');
      localStorage.removeItem('lastAuthTime');
      setStatus('All authentication data reset successfully');
      
      // Refresh displayed data
      setUserData(JSON.stringify({
        user: null,
        redirectCount: null,
        lastAuthTime: null,
        onboardingComplete: localStorage.getItem('mindmateOnboardingComplete')
      }, null, 2));
    } catch (e) {
      setStatus(`Error: ${e}`);
    }
  };
  
  const createTempUser = () => {
    try {
      // Create a simple temporary user
      const tempUser = {
        id: 'debug-user-' + Date.now(),
        email: 'debug@example.com',
        pseudonym: 'Debug User'
      };
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(tempUser));
      
      // Reset redirect counter and set auth time
      localStorage.removeItem('redirectCount');
      localStorage.setItem('lastAuthTime', Date.now().toString());
      
      setStatus('Temporary debug user created successfully');
      
      // Refresh displayed data
      const user = localStorage.getItem('user');
      const redirectCount = localStorage.getItem('redirectCount');
      const lastAuthTime = localStorage.getItem('lastAuthTime');
      const onboardingComplete = localStorage.getItem('mindmateOnboardingComplete');
      
      setUserData(JSON.stringify({
        user: user ? JSON.parse(user) : null,
        redirectCount,
        lastAuthTime,
        onboardingComplete
      }, null, 2));
    } catch (e) {
      setStatus(`Error creating temp user: ${e}`);
    }
  };
  
  const directNavigate = () => {
    // This is a force navigation that bypasses the normal routing
    if (navigateTo) {
      window.location.href = navigateTo;
    }
  };
  
  const goToLogin = () => {
    window.location.href = '/login';
  };
  
  const goToHome = () => {
    window.location.href = '/';
  };
  
  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Login Debugging Tool</CardTitle>
          <CardDescription>
            Use this tool to diagnose and fix login issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userData">Current Authentication State:</Label>
            <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto mt-2 max-h-80">
              {userData}
            </pre>
          </div>
          
          {status && (
            <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md mb-4">
              {status}
            </div>
          )}
          
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="directNav">Direct Navigation:</Label>
            <div className="flex space-x-2">
              <Input 
                id="directNav" 
                value={navigateTo} 
                onChange={(e) => setNavigateTo(e.target.value)}
                placeholder="/path/to/navigate"
              />
              <Button onClick={directNavigate}>Go</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter any path to bypass authentication and navigate directly
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="outline" onClick={resetRedirectCounter}>
              Reset Redirect Counter
            </Button>
            <Button variant="destructive" onClick={resetAllAuthData}>
              Reset All Auth Data
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="secondary" onClick={createTempUser}>
              Create Temp User
            </Button>
            <Button variant="gradient" onClick={goToHome}>
              Go to Home
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 