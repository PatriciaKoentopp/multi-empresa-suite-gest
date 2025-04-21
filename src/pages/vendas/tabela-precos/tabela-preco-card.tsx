
import React from "react";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type TabelaPreco = {
  id: number;
  nome: string;
  vigencia: { dataInicial: Date | null; dataFinal: Date | null };
  servicos: { servicoId: number; nome: string; preco: number }[];
};

interface TabelaPrecoCardProps {
  tabela: TabelaPreco;
  onVisualizar: (tabela: TabelaPreco) => void;
  onEditar: (tabela: TabelaPreco) => void;
  onExcluir: (tabela: TabelaPreco) => void;
}

export const TabelaPrecoCard: React.FC<TabelaPrecoCardProps> = ({
  tabela,
  onVisualizar,
  onEditar,
  onExcluir,
}) => (
  <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col gap-2 hover:shadow-md transition">
    <div className="flex justify-between items-start">
      <div>
        <div className="font-bold text-base mb-1">{tabela.nome}</div>
        <div className="text-xs text-muted-foreground">
          Vigência:{" "}
          {tabela.vigencia.dataInicial
            ? tabela.vigencia.dataInicial.toLocaleDateString("pt-BR")
            : "-"}{" "}
          até{" "}
          {tabela.vigencia.dataFinal
            ? tabela.vigencia.dataFinal.toLocaleDateString("pt-BR")
            : "-"}
        </div>
        <div className="text-xs mt-1">
          Serviços: <b>{tabela.servicos.length}</b>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Ações">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onVisualizar(tabela)} className="gap-2">
            <Eye color="#0EA5E9" /> Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEditar(tabela)} className="gap-2">
            <Edit color="#0EA5E9" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExcluir(tabela)} className="gap-2 text-red-600">
            <Trash2 color="#ea384c" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

