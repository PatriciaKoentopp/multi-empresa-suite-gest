
import React, { useState } from "react";
import { PlanoConta } from "@/types/plano-contas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlanoContasTableProps {
  contas: PlanoConta[];
  onEdit: (conta: PlanoConta) => void;
  onDelete: (id: string) => void;
}

export function PlanoContasTable({
  contas,
  onEdit,
  onDelete,
}: PlanoContasTableProps) {
  const [contaToDelete, setContaToDelete] = useState<PlanoConta | null>(null);

  const handleDelete = () => {
    if (contaToDelete) {
      onDelete(contaToDelete.id);
      setContaToDelete(null);
    }
  };

  // Função para formatar a classificação DRE para exibição
  const formatarClassificacaoDRE = (classificacao: string | undefined) => {
    if (!classificacao || classificacao === 'nao_classificado') return "Não classificado";
    
    // Mapeia os valores do banco de dados para textos mais amigáveis
    const mapeamento: Record<string, string> = {
      'receita_bruta': 'Receita Bruta',
      'deducoes': 'Deduções',
      'custos': 'Custos',
      'despesas_operacionais': 'Despesas Operacionais',
      'receitas_financeiras': 'Receitas Financeiras',
      'despesas_financeiras': 'Despesas Financeiras', 
      'distribuicao_lucros': 'Distribuição de Lucros',
      'impostos_irpj_csll': 'IRPJ/CSLL'
    };

    return mapeamento[classificacao] || "Não classificado";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Classificação DRE</TableHead>
            <TableHead className="w-[150px]">Considerar no DRE</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[80px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                Nenhuma conta encontrada
              </TableCell>
            </TableRow>
          ) : (
            contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell className="font-medium">{conta.codigo}</TableCell>
                <TableCell>{conta.descricao}</TableCell>
                <TableCell className="capitalize">{conta.tipo}</TableCell>
                <TableCell className="capitalize">{conta.categoria}</TableCell>
                <TableCell>{formatarClassificacaoDRE(conta.classificacao_dre)}</TableCell>
                <TableCell>
                  {conta.considerar_dre ? "Sim" : "Não"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      conta.status === "ativo"
                        ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                        : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                    }`}
                  >
                    {conta.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem
                        onClick={() => onEdit(conta)}
                        className="flex gap-2 items-center cursor-pointer text-blue-500 focus:text-blue-500 focus:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setContaToDelete(conta)}
                        className="flex gap-2 items-center cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!contaToDelete} onOpenChange={() => setContaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white hover:bg-gray-100">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
