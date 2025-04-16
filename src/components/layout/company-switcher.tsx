
import { useCompany } from "@/contexts/company-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronsUpDown, PlusCircleIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface CompanySwitcherProps {
  className?: string;
}

export function CompanySwitcher({ className }: CompanySwitcherProps) {
  const [open, setOpen] = useState(false);
  const { currentCompany, availableCompanies, setCurrentCompany } = useCompany();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecione uma empresa"
          className={cn("w-full justify-between font-normal", className)}
        >
          {currentCompany?.nomeFantasia || "Selecione uma empresa"}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px]">
        <DropdownMenuLabel>Empresas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableCompanies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => setCurrentCompany(company)}
            className="cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <span className="truncate">{company.nomeFantasia}</span>
              {currentCompany?.id === company.id && (
                <CheckIcon className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin/empresas/nova" className="flex cursor-pointer items-center">
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            <span>Adicionar empresa</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
