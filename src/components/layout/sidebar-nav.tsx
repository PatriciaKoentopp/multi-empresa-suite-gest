
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { mainNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { ModuleNavItem, SubNavItem } from "@/types";
import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { useLocation, Link } from "react-router-dom";

interface SidebarNavProps {
  isCollapsed: boolean;
  closeSidebar?: () => void;
}

export function SidebarNav({ isCollapsed, closeSidebar }: SidebarNavProps) {
  const { pathname } = useLocation();

  const getIcon = (iconName: string): LucideIcon => {
    // @ts-ignore - Dynamic icon access
    const Icon = Icons[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || Icons.Circle;
    return Icon;
  };

  const onNavigate = () => {
    if (closeSidebar) {
      closeSidebar();
    }
  };

  const renderLink = (item: ModuleNavItem | SubNavItem, isSubItem = false) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = getIcon((item as ModuleNavItem).icon || "circle");

    return (
      <Button
        asChild
        variant="ghost"
        className={cn(
          "w-full justify-start",
          isCollapsed ? "px-2" : "px-4",
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
          isSubItem && "pl-8"
        )}
      >
        <Link to={item.href} onClick={onNavigate}>
          {!isSubItem && (
            <Icon className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
          )}
          {!isCollapsed && <span>{item.name}</span>}
          {isCollapsed && isSubItem && <span className="sr-only">{item.name}</span>}
        </Link>
      </Button>
    );
  };

  if (isCollapsed) {
    return (
      <div className="flex w-full flex-col gap-1 p-2">
        {mainNavigation.map((item) => (
          <div key={item.href} className="relative">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
              title={item.name}
            >
              <Link to={item.href} onClick={onNavigate}>
                {(() => {
                  const Icon = getIcon(item.icon);
                  return <Icon className="h-4 w-4" />;
                })()}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {mainNavigation.map((item) => {
        if (item.subItems && item.subItems.length > 0) {
          const isOpen = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Accordion
              key={item.href}
              type="single"
              defaultValue={isOpen ? item.href : undefined}
              className="border-none"
            >
              <AccordionItem value={item.href} className="border-none">
                <AccordionTrigger 
                  className={cn(
                    "px-4 gap-1 hover:bg-accent/50 hover:no-underline py-2 rounded-md",
                    isOpen ? "bg-accent/60 text-accent-foreground font-medium" : ""
                  )}
                >
                  <div className="flex items-center text-left">
                    {(() => {
                      const Icon = getIcon(item.icon);
                      return <Icon className="h-4 w-4 mr-2" />;
                    })()}
                    <span>{item.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pt-1">
                  <div className="flex flex-col gap-1">
                    {item.subItems.map((subItem) => (
                      <div key={subItem.href}>{renderLink(subItem, true)}</div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        }
        
        return <div key={item.href}>{renderLink(item)}</div>;
      })}
    </div>
  );
}
