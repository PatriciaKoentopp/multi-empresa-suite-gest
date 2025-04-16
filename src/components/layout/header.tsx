
import { useIsMobile } from "@/hooks/use-mobile";
import { MoonIcon, SunIcon } from "lucide-react";
import { UserNav } from "./user-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

export function Header() {
  const isMobile = useIsMobile();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Check user's system preference on component mount
  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Check localStorage first
    const storedTheme = localStorage.getItem("erp-theme") as "light" | "dark" | null;
    
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    } else if (isDarkMode) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);
  
  // Update theme when it changes
  const setMode = (mode: "light" | "dark") => {
    localStorage.setItem("erp-theme", mode);
    setTheme(mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
  };

  return (
    <header className="flex h-14 items-center border-b px-4 lg:px-6">
      <div className={`ml-${isMobile ? "0" : "0"} flex-1`}></div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {theme === "dark" ? (
                <MoonIcon className="h-4 w-4" />
              ) : (
                <SunIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Alternar tema</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setMode("light")}>
              <SunIcon className="mr-2 h-4 w-4" />
              <span>Claro</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("dark")}>
              <MoonIcon className="mr-2 h-4 w-4" />
              <span>Escuro</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UserNav />
      </div>
    </header>
  );
}
