
import React from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ModuleNavItem, SubNavItem } from "@/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ModuleNavItem[];
  isCollapsed?: boolean;
  closeSidebar?: () => void;
}

// Função auxiliar para renderizar ícones a partir de strings
const renderIcon = (icon?: React.ReactNode | string) => {
  if (!icon) return null;
  
  if (typeof icon === 'string') {
    // @ts-ignore - Ignoramos este erro porque sabemos que estamos lidando com ícones dinâmicos
    const Icon = LucideIcons[icon] || LucideIcons.Circle;
    return <Icon className="h-4 w-4" />;
  }
  
  return icon;
};

export function SidebarNav({ items, className, isCollapsed, closeSidebar, ...props }: SidebarNavProps) {
  const location = useLocation();

  return (
    <nav className={cn("grid gap-1", className)} {...props}>
      {items.map((item, index) => {
        // Verificar se a rota atual corresponde ao item ou aos subitens
        const isRouteActive =
          location.pathname === item.href ||
          item.subItems?.some((subItem) => location.pathname === subItem.href);

        // Se o item tem sub-items, usar Collapsible
        if (item.subItems && item.subItems.length > 0) {
          return (
            <Collapsible
              key={index}
              defaultOpen={isRouteActive}
              className="border border-transparent transition-colors"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "group flex w-full items-center justify-between py-2",
                    isRouteActive && "font-semibold text-blue-600 dark:text-blue-400"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {renderIcon(item.icon)}
                    {!isCollapsed && <span>{item.name}</span>}
                  </div>
                  {!isCollapsed && item.subItems && item.subItems.length > 0 && (
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                  )}
                </Button>
              </CollapsibleTrigger>
              {!isCollapsed && (
                <CollapsibleContent className="pl-4">
                  <div className="grid gap-1">
                    {item.subItems.map((subItem, subIndex) => {
                      const isSubRouteActive = location.pathname === subItem.href;
                      return (
                        <Link 
                          key={subIndex} 
                          to={subItem.href}
                          onClick={closeSidebar}
                        >
                          <Button
                            variant="ghost"
                            className={cn(
                              "flex w-full items-center justify-start gap-3 py-2",
                              isSubRouteActive && "font-semibold text-blue-600 dark:text-blue-400"
                            )}
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span>{subItem.name}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              )}
            </Collapsible>
          );
        }

        // Se o item não tem sub-items, usar Link
        return (
          <Link 
            key={index} 
            to={item.href || "#"}
            onClick={closeSidebar}
          >
            <Button
              variant="ghost"
              className={cn(
                "flex w-full items-center justify-start gap-3 py-2",
                isRouteActive && "font-semibold text-blue-600 dark:text-blue-400"
              )}
            >
              {renderIcon(item.icon)}
              {!isCollapsed && <span>{item.name}</span>}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
