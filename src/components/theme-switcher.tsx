"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Laptop, Wand2, Star, Heart, Smile, CloudDrizzle, Flame, AlertTriangle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeSwitcherProps {
  id?: string;
}

export function ThemeSwitcher({ id }: ThemeSwitcherProps) {
  const { setTheme, theme } = useTheme();

  const icons = {
    light: Sun,
    dark: Moon,
    system: Laptop,
    ghibli: Wand2,
    "outer-space": Star, // Placeholder icon
    pink: Heart, // Placeholder icon
    joy: Smile, // Placeholder icon
    sadness: CloudDrizzle, // Placeholder icon
    anger: Flame, // Placeholder icon
    fear: AlertTriangle, // Placeholder icon
    disgust: XCircle, // Placeholder icon
    vietnam: Star, // Placeholder icon for Vietnam theme (Star from flag)
  };

  const ThemeIcon = icons[theme as keyof typeof icons] || Sun;

  return (
    <DropdownMenu> {/* Keep ID here for Joyride targetting */}
      <DropdownMenuTrigger asChild>
        <Button
          id={id || "theme-switcher"}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ThemeIcon className="h-[1.2rem] w-[1.2rem]" />
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-morphism border-border/50 shadow-lg animate-in fade-in-0 zoom-in-95"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <Sun className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <Moon className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <Laptop className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">System</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("ghibli")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <Wand2 className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Ghibli</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("outer-space")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <Star className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Outer Space</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("pink")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <Heart className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Pink</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("joy")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <Smile className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Joy</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("sadness")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <CloudDrizzle className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Sadness</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("anger")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <Flame className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Anger</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("fear")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <AlertTriangle className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Fear</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("disgust")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <XCircle className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Disgust</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("vietnam")}
          className="hover:bg-primary/10 focus:bg-primary/10 cursor-pointer group"
        >
          <Star className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Vietnam</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
