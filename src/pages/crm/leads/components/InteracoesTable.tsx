import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRound, Eye, Edit, Trash2, CheckCircle, Circle } from "lucide-react";
import { LeadInteracao } from "../types";
import { getIconForInteraction } from "../utils/leadUtils";

interface InteracoesTableProps {
  interacoes: LeadInteracao[];
  carregandoInteracoes?: boolean;
  onVerInteracao: (interacao: LeadInteracao) => void;
  onEditarInteracao: (interacao: LeadInteracao) => void;
  onExcluirInteracao: (interacao: LeadInteracao) => void;
  onToggleStatus?: (interacao: LeadInteracao) => void;
  getNomeResponsavel?: (id: string) => string;
}

export function InteracoesTable({ 
  interacoes, 
  carregandoInteracoes = false,
  onVerInteracao, 
  onEditarInteracao, 
  onExcluirInteracao,
  onToggleStatus,
  getNomeResponsavel = () => "Não atribuído"
}: InteracoesTableProps) {
  // Função para formatar a data no padrão brasileiro DD/MM/YYYY
  const formatarDataBR = (data: string | Date): string => {
    if (!data) return "-";
    
    // Se for um objeto Date, converter para string
    if (data instanceof Date) {
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    // Se for string e já estiver no formato DD/MM/YYYY, retornar como está
    if (typeof data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
    
    // Se for string no formato ISO (YYYY-MM-DD)
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    
    // Para outros formatos, tentar converter
    try {
      const dataObj = new Date(data);
      const dia = String(dataObj.getDate()).padStart(2, '0');
      const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
      const ano = dataObj.getFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      return typeof data === 'string' ? data : "-";
    }
  };

  if (carregandoInteracoes) {
    return (
      <div className="flex justify-center items-center p-8">
        <p>Carregando interações...</p>
      </div>
    );
  }

  if (!interacoes || interacoes.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <p className="text-muted-foreground">Nenhuma interação registrada.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interacoes.map((interacao) => (
              <TableRow key={interacao.id} data-interacao-id={interacao.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getIconForInteraction(interacao.tipo)}
                    <span className="capitalize">{interacao.tipo}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {interacao.descricao}
                </TableCell>
                <TableCell>{formatarDataBR(interacao.data)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <UserRound className="h-3 w-3 text-gray-500" />
                    <span>{interacao.responsavelNome || getNomeResponsavel(interacao.responsavelId)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`status-cell inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    interacao.status === "Realizado" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {interacao.status === "Realizado" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <Circle className="mr-1 h-3 w-3" />
                    )}
                    {interacao.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onVerInteracao(interacao)}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditarInteracao(interacao)}
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    {onToggleStatus && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onToggleStatus(interacao)}
                        title={interacao.status === "Realizado" ? "Marcar como Aberto" : "Marcar como Realizado"}
                      >
                        {interacao.status === "Realizado" ? (
                          <Circle className="h-4 w-4 text-blue-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onExcluirInteracao(interacao)}
                      title="Excluir interação"
                      disabled={interacao.status !== "Aberto"}
                      className={interacao.status !== "Aberto" ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
