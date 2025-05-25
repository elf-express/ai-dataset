"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { FileCode2, Github, Settings, Plus } from "lucide-react";

export function Header({ 
  remainingUsage = 0, 
  usageLimit = parseInt(process.env.NEXT_PUBLIC_DAILY_USAGE_LIMIT || "5"), 
  onSettingsClick, 
  onContactClick,
  isPasswordVerified = false,
  hasCustomConfig = false 
}) {
  const hasUnlimitedAccess = isPasswordVerified || hasCustomConfig;

  return (
    <header className="border-b">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-6 w-6" />
          <span className="text-lg font-bold">Smart Mermaid</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasUnlimitedAccess ? (
              <span className="text-green-600 font-semibold">無限量</span>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onContactClick}
                  title="聯繫作者獲取更多使用次數"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                剩餘: <span className={remainingUsage <= 1 ? "text-red-500 font-bold" : "text-green-600 font-semibold"}>{remainingUsage}</span>/{usageLimit}
              </>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSettingsClick}
            title="設置"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <a 
            href="https://github.com/liujuntao123/smart-mermaid"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80"
          >
            <Github className="h-5 w-5" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
} 