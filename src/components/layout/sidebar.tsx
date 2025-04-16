
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { PanelLeftCloseIcon, PanelLeftIcon } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { useAuth } from "@/contexts/auth-context";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  // Mobile sidebar (sheet)
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileSidebar}
          className="fixed left-4 top-3 z-10 xl:hidden"
        >
          <PanelLeftIcon className="h-5 w-5" />
          <span className="sr-only">Abrir menu lateral</span>
        </Button>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0 pt-10">
            <SheetHeader className="p-4 pb-2">
              <SheetTitle className="text-left">
                ERP Multi-empresa
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full">
              <div className="flex-grow overflow-y-auto">
                <SidebarNav isCollapsed={false} closeSidebar={closeMobileSidebar} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "group/sidebar relative flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[60px]" : "w-[280px]",
        className
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <div className={cn("flex flex-1 items-center", isCollapsed && "justify-center")}>
          {!isCollapsed && (
            <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
              ERP Multi-empresa
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isCollapsed ? (
            <PanelLeftIcon className="h-4 w-4" />
          ) : (
            <PanelLeftCloseIcon className="h-4 w-4" />
          )}
          <span className="sr-only">Alternar barra lateral</span>
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <SidebarNav isCollapsed={isCollapsed} />
      </div>
      
      <div className="flex items-center justify-center border-t p-2">
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "sm"}
          className="w-full justify-start"
        >
          <span className={cn(isCollapsed ? "sr-only" : "")}>Ajuda</span>
        </Button>
      </div>
    </aside>
  );
}
