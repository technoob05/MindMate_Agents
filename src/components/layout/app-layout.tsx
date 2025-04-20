'use client'; // This component uses client hooks (usePathname)

'use client'; // This component uses client hooks (usePathname, useRouter)

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
import { Home, MessageSquare, Users, Bot, Settings, Smile, User, LogOut, BookHeart } from 'lucide-react'; // Added User, LogOut, BookHeart
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet for potential mobile menu drawer later
import { PanelLeft } from "lucide-react"; // Icon for mobile menu trigger if needed

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chat', label: '1-on-1 Chat', icon: MessageSquare },
  { href: '/journal', label: 'Guided Journal', icon: BookHeart }, // Added Journal link
  { href: '/ai-avatar', label: 'AI Avatar', icon: Smile }, // Added AI Avatar link
  { href: '/ai-team-chat', label: 'AI Team Chat', icon: Bot },
  { href: '/multi-user-chat', label: 'Community Chat', icon: Users },
  // Add settings or other links later
  // { href: '/settings', label: 'Settings', icon: Settings }, // Keep settings commented for now
];

// Filter items for bottom nav (optional, can show all)
const bottomNavItems = navItems.filter(item => ['/', '/chat', '/journal', '/ai-avatar'].includes(item.href)); // Example: Show fewer items

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Placeholder logout function
  const handleLogout = () => {
    // In a real app, clear session/token here
    console.log("Logging out...");
    router.push('/login');
  };

  // Placeholder user data (replace with actual data when auth state is managed)
  const userEmail = "user@example.com"; // Example email
  const userPseudonym = "MindfulUser"; // Example pseudonym

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen w-full flex-col sm:flex-row bg-gradient-to-br from-[rgb(var(--background-start-rgb))] to-[rgb(var(--background-end-rgb))]">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-16 flex-col border-r bg-background/80 backdrop-blur-sm sm:flex shadow-md"> {/* Increased width slightly, added transparency, blur, shadow */}
          <nav className="flex flex-col items-center gap-4 px-2 py-5">
            {/* Enhanced Logo */}
            <Link
              href="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-secondary text-lg font-semibold text-primary-foreground mb-5 transition-transform duration-300 ease-out hover:scale-110" // Gradient bg, larger, margin bottom, hover effect
            >
              {/* MH for Mindful Hub / MindMate */}
              <span className="font-bold text-sm">MM</span> {/* Adjusted text size */}
              <span className="sr-only">MindMate</span>
            </Link>

            {/* Navigation Icons - Enhanced Styling */}
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)); // More robust active check
              return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground hover:bg-accent/50 md:h-9 md:w-9 group", // Added relative, group class, hover bg
                      isActive ? "bg-primary/20 text-primary scale-110 shadow-inner" : "" // Enhanced active state: subtle bg, primary color, scale, inner shadow
                    )}
                  >
                    {/* Active indicator */}
                     {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"></span>}
                    <item.icon className={cn("h-5 w-5 transition-transform duration-200 ease-in-out", isActive ? "scale-110" : "group-hover:scale-110")} /> {/* Icon scaling */}
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs"> {/* Styled tooltip */}
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )})}
          </nav>

          {/* Bottom Icons: Theme Switcher and User Menu */}
           <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-5">
              {/* Theme Switcher */}
             <Tooltip>
               <TooltipTrigger asChild>
                 {/* Directly use ThemeSwitcher, TooltipTrigger handles the child */}
                 <ThemeSwitcher />
               </TooltipTrigger>
               <TooltipContent side="right" className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">Change theme</TooltipContent>
             </Tooltip>

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                   {/* Use Button for consistent styling and click area */}
                  <DropdownMenuTrigger asChild>
                     <Button
                      variant="ghost" // Use ghost variant for subtle look
                      className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:h-9 md:w-9 p-0 hover:bg-accent/50" // Adjusted size, hover bg, rounded-full
                    >
                      <Avatar className="h-8 w-8 md:h-7 md:w-7"> {/* Slightly larger avatar */}
                        {/* Placeholder image - replace with actual user image if available */}
                        {/* <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" /> */}
                        <AvatarFallback className="text-xs font-semibold bg-secondary/50 text-secondary-foreground"> {/* Added subtle bg */}
                          {/* Show initials from pseudonym or email */}
                          {userPseudonym ? userPseudonym.substring(0, 2).toUpperCase() : userEmail.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="sr-only">User Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">User Menu</TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="right" align="end" className="bg-background/90 backdrop-blur-sm border-border/50 shadow-lg rounded-md"> {/* Styled dropdown */}
                <DropdownMenuLabel className="font-medium text-muted-foreground px-3 py-2">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem asChild className="focus:bg-accent/50 cursor-pointer mx-1 rounded">
                  <Link href="/profile" className="flex items-center gap-2 px-2 py-1.5 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-100 dark:focus:bg-red-900/50 focus:text-red-700 dark:focus:text-red-300 mx-1 px-2 py-1.5 text-sm rounded">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col sm:pl-16 pb-16 sm:pb-0"> {/* Adjusted left padding for wider sidebar, added bottom padding for mobile nav */}
          {/* Mobile Header (Optional - can add later if needed) */}
          {/* <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:hidden shadow-sm">
             <Link href="/" className="font-bold text-lg">MindMate</Link>
             <ThemeSwitcher /> // Example: Theme switcher in mobile header
          </header> */}

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"> {/* Added overflow-y-auto, adjusted padding */}
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/90 backdrop-blur-sm p-2 sm:hidden shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_10px_-3px_rgba(255,255,255,0.05)]">
            <div className="grid grid-cols-4 gap-1"> {/* Adjust grid-cols based on bottomNavItems count */}
              {bottomNavItems.map((item) => {
                 const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                 return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors duration-200 ease-in-out",
                      isActive
                        ? "text-primary scale-[1.03]" // Active state: primary color, slight scale
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50" // Inactive state: muted color, hover effects
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-transform duration-200 ease-in-out", isActive ? "scale-110" : "")} />
                    <span>{item.label}</span>
                  </Link>
                 )
              })}
            </div>
          </nav>
        </div>
      </div>
    </TooltipProvider>
  );
}
