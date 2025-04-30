
import { useIsMobile } from "@/hooks/use-mobile";
import { UserNav } from "./user-nav";

export function Header() {
  const isMobile = useIsMobile();

  return (
    <header className="flex h-14 items-center border-b px-4 lg:px-6">
      <div className={`ml-${isMobile ? "0" : "0"} flex-1`}></div>
      <div className="flex items-center gap-2">
        <UserNav />
      </div>
    </header>
  );
}
