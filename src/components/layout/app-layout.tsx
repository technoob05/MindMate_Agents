'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, MessageSquare, Users, Bot, Settings, Smile, User, LogOut, BookHeart, Menu, Lightbulb, Newspaper } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { NextResponse } from 'next/server';

const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'AI Team Chat', href: '/ai-team-chat', icon: Users },
  { name: 'AI Avatar', href: '/ai-avatar', icon: Bot },
  { name: 'AI Explainer', href: '/ai-explainer', icon: Lightbulb }, // Added AI Explainer link
  { name: 'Journal', href: '/journal', icon: BookHeart },
  { name: 'Multi-user Chat', href: '/multi-user-chat', icon: MessageSquare },
  { name: 'News', href: '/news', icon: Newspaper },
];

// Simple helper to prevent circular redirections - đơn giản hóa
const preventRedirectLoop = () => {
  const redirectCount = parseInt(localStorage.getItem('redirectCount') || '0');
  if (redirectCount > 2) { // Decreased from 5 to 2
    console.log('Redirect loop detected, staying on current page');
    localStorage.setItem('redirectCount', '0');
    return false;
  }
  localStorage.setItem('redirectCount', (redirectCount + 1).toString());
  return true;
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Check if current path is login, register, onboarding or any debug route
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/onboarding' || pathname.startsWith('/debug/');

  console.log('AppLayout rendering, pathname:', pathname, 'isAuthPage:', isAuthPage, 'Current time:', new Date().toISOString());

  // Log to help debug authentication issues - temporary
  if (typeof window !== 'undefined') {
    try {
      const storedUser = localStorage.getItem('user');
      const redirectCount = localStorage.getItem('redirectCount');
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      
      console.log('[DEBUG AppLayout] localStorage state:', { 
        hasUser: !!storedUser, 
        redirectCount, 
        lastLoginTime
      });
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('[DEBUG AppLayout] User data:', { id: userData.id, email: userData.email });
        } catch (e) {
          console.error('[DEBUG AppLayout] Error parsing user data:', e);
        }
      }
    } catch (e) {
      console.error('[DEBUG AppLayout] Error accessing localStorage:', e);
    }
  }

  // Initialize user state from localStorage
  useEffect(() => {
    console.log('AppLayout useEffect running, pathname:', pathname);
    setIsClient(true);
    
    // Nếu đang ở trang đăng nhập/đăng ký hoặc đường dẫn /chat, đơn giản hiển thị trang đó
    // EMERGENCY FIX: Always allow /chat route without auth checks
    if (isAuthPage || pathname === '/chat' || pathname.startsWith('/debug/')) {
      console.log('On auth page or chat route, skipping authentication check');
      
      // For /chat, try to get user data but don't redirect if missing
      if (pathname === '/chat') {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } else {
            // If no user, create a temporary one for the session
            const tempUser = { id: 'temp-' + Date.now(), pseudonym: 'Guest User' };
            localStorage.setItem('user', JSON.stringify(tempUser));
            setUser(tempUser);
          }
        } catch (e) {
          console.error('Error setting up user for chat:', e);
        }
      }
      
      return;
    }
    
    // Rest of the authentication logic for other pages
    try {
      // Đọc thông tin người dùng từ localStorage
      const storedUser = localStorage.getItem('user');
      
      // Nếu có người dùng, cố gắng phân tích dữ liệu
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // FIXED: Much more forgiving authentication check - accept any user data with meaningful fields
          if (parsedUser && (parsedUser.id || parsedUser.email || parsedUser.pseudonym)) {
            console.log('User found, setting user state');
            setUser(parsedUser);
            
            // Record the last authentication time
            localStorage.setItem('lastAuthTime', Date.now().toString());
            // Reset redirect counter since we're successfully authenticated
            localStorage.removeItem('redirectCount');
            return;
          }
          
          // Nếu người dùng không hợp lệ, xóa và chuyển đến trang đăng nhập
          console.log('Invalid user data, redirecting to login');
          localStorage.removeItem('user');
          
          if (preventRedirectLoop()) {
            const redirectTo = encodeURIComponent(pathname);
            router.push(`/login?redirect=${redirectTo}`);
          }
        } catch (e) {
          // Lỗi khi phân tích dữ liệu người dùng
          console.error('Error parsing user from localStorage:', e);
          localStorage.removeItem('user');
          
          if (preventRedirectLoop()) {
            const redirectTo = encodeURIComponent(pathname);
            router.push(`/login?redirect=${redirectTo}`);
          }
        }
      } else {
        // Không có người dùng, chuyển đến trang đăng nhập
        console.log('No user found, redirecting to login');
        
        if (preventRedirectLoop()) {
          const redirectTo = encodeURIComponent(pathname);
          console.log(`Redirecting unauthenticated access from ${pathname} to /login?redirect=${redirectTo}`);
          router.push(`/login?redirect=${redirectTo}`);
        }
      }
    } catch (e) {
      console.error('Error in AppLayout authentication check:', e);
    }
  }, [isAuthPage, pathname, router]);

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      localStorage.removeItem('redirectCount'); // Reset redirect counter
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        console.log('Logout successful');
      } else {
        console.error('Logout failed');
      }
    } catch (e) {
      console.error('Error during logout:', e);
    } finally {
      // Clear the user from localStorage
      localStorage.removeItem('user');
      setUser(null);
      // Redirect to login
      router.push('/login');
    }
  };

  // If we're on an auth page, just render the children without the app layout
  if (isAuthPage) {
    console.log('Rendering auth page without layout');
    return <>{children}</>;
  }

  // If client-side rendering hasn't happened yet, return loading
  if (!isClient) {
    console.log('Client-side rendering not ready yet');
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-center text-muted-foreground">Loading...</p>
    </div>;
  }

  // If we need user authentication and don't have it, show loading
  // This prevents flash of content before redirect
  if (!user && !isAuthPage) {
    console.log('User not authenticated on protected page, showing loading');
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-center text-muted-foreground">Checking authentication...</p>
    </div>;
  }

  console.log('Rendering full app layout for authenticated user');
  return (
    <div className="flex h-screen">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-background border-r fixed top-0 left-0 h-screen">
        <div className="flex flex-col h-full p-4">
          <div className="space-y-4">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-auto space-y-4">
            <ThemeSwitcher id="theme-switcher" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start space-x-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/avatar.png" />
                    <AvatarFallback>{user?.pseudonym?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <span>{user?.pseudonym || user?.email || 'Profile'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <div className="flex flex-col h-full space-y-4 py-4">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
          <SheetClose />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 h-full p-4 md:ml-64">{children}</main>
    </div>
  );
}
