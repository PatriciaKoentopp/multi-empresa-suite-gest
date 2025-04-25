
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatCurrency } from "@/utils";

export interface ContaReceber {
  id: string;
  cliente: string;
  descricao: string;
  dataVencimento: Date;
  dataRecebimento?: Date;
  valor: number;
  status: "recebido" | "recebido_em_atraso" | "em_aberto";
  numeroParcela: string;
  origem?: string;
}

interface ContasAReceberTableProps {
  contas: ContaReceber[];
  onEdit: (conta: ContaReceber) => void;
  onBaixar: (conta: ContaReceber) => void;
  onDelete: (id: string) => void;
  onVisualizar: (conta: ContaReceber) => void;
}

export function ContasAReceberTable({
  contas,
  onEdit,
  onBaixar,
  onDelete,
  onVisualizar,
}: ContasAReceberTableProps) {
  function formatData(data?: Date) {
    if (!data) return "-";
    return format(data, "dd/MM/yyyy");
  }

  function getStatusColor(status: ContaReceber["status"]) {
    switch (status) {
      case "recebido":
        return "text-green-600";
      case "recebido_em_atraso":
        return "text-red-600";
      case "em_aberto":
        return "text-blue-600";
    }
  }

  function getStatusText(status: ContaReceber["status"]) {
    switch (status) {
      case "recebido":
        return "Recebido";
      case "recebido_em_atraso":
        return "Recebido em Atraso";
      case "em_aberto":
        return "Em Aberto";
    }
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Data Venc.</TableHead>
            <TableHead className="w-[120px]">Data Rec.</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right w-[120px]">Valor</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[120px]">Parcela</TableHead>
            <TableHead className="text-center w-[140px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                Nenhuma conta a receber encontrada
              </TableCell>
            </TableRow>
          ) : (
            contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell className="text-center">{formatData(conta.dataVencimento)}</TableCell>
                <TableCell className="text-center">{formatData(conta.dataRecebimento)}</TableCell>
                <TableCell className="font-medium">{conta.cliente}</TableCell>
                <TableCell>{conta.descricao}</TableCell>
                <TableCell className="text-right">{formatCurrency(conta.valor)}</TableCell>
                <TableCell>
                  <span className={getStatusColor(conta.status)}>
                    {getStatusText(conta.status)}
                  </span>
                </TableCell>
                <TableCell className="text-center">{conta.numeroParcela}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-500 hover:bg-blue-100"
                      onClick={() => onVisualizar(conta)}
                      title="Visualizar"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-500 hover:bg-green-100"
                      onClick={() => onBaixar(conta)}
                      title="Receber"
                      disabled={conta.status === "recebido" || conta.status === "recebido_em_atraso"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-yellow-500 hover:bg-yellow-100"
                      onClick={() => onEdit(conta)}
                      title="Editar"
                      disabled={conta.status === "recebido" || conta.status === "recebido_em_atraso"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-100"
                      onClick={() => onDelete(conta.id)}
                      title="Excluir"
                      disabled={conta.status === "recebido" || conta.status === "recebido_em_atraso"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
