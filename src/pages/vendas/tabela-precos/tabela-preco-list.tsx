
import React from "react";
import { Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

type TabelaPreco = {
  id: number;
  nome: string;
  vigencia: { dataInicial: Date | null; dataFinal: Date | null };
  servicos: { servicoId: number; nome: string; preco: number }[];
};

interface TabelaPrecoListProps {
  tabelas: TabelaPreco[];
  onEditar: (tab: TabelaPreco) => void;
  onExcluir: (id: number) => void;
  onVisualizar: (tab: TabelaPreco) => void;
}

export const TabelaPrecoList: React.FC<TabelaPrecoListProps> = ({
  tabelas,
  onEditar,
  onExcluir,
  onVisualizar
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="bg-muted px-4 py-2 rounded-t font-semibold flex items-center">
        <div className="flex-1 text-left">Nome</div>
        <div className="w-56 text-left hidden md:block">Vigência</div>
        <div className="w-48 text-center">Ações</div>
      </div>
      {tabelas.map(tab => (
        <div
          key={tab.id}
          className="flex items-center border-b bg-white hover:bg-blue-50 transition-colors px-4 py-2"
        >
          <div className="flex-1 text-left font-medium">{tab.nome}</div>
          <div className="w-56 text-left text-xs text-muted-foreground hidden md:block">
            {tab.vigencia.dataInicial && tab.vigencia.dataFinal
              ? `de ${tab.vigencia.dataInicial.toLocaleDateString("pt-BR")} até ${tab.vigencia.dataFinal.toLocaleDateString("pt-BR")}`
              : "-"}
          </div>
          <div className="w-48 flex gap-2 justify-center">
            <Button
              variant="ghost"
              size="icon"
              title="Visualizar"
              onClick={() => onVisualizar(tab)}
            >
              <Eye color="#0EA5E9" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Editar"
              onClick={() => onEditar(tab)}
            >
              <Edit color="#0EA5E9" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Excluir"
              onClick={() => onExcluir(tab.id)}
            >
              <Trash2 color="#ea384c" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
