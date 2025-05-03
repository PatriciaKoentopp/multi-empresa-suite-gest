
import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CrmDashboardHeaderProps {
  title: string;
  description?: string;
}

export function CrmDashboardHeader({ title, description }: CrmDashboardHeaderProps) {
  return (
    <div className="mb-2">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {description || `Última atualização: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`}
      </p>
    </div>
  );
}
