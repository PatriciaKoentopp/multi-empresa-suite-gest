
import React, { useState } from "react";
import { NovaInteracaoForm } from "./NovaInteracaoForm";
import { InteracoesTable } from "./InteracoesTable";
import { InteracaoViewDialog } from "./InteracaoViewDialog";
import { InteracaoEditDialog } from "./InteracaoEditDialog";
import { InteracaoDeleteDialog } from "./InteracaoDeleteDialog";
import { LeadInteracao } from "../types";
import { Usuario } from "@/types";

interface InteracoesTabProps {
  lead: any | undefined;
  interacoes: LeadInteracao[];
  carregandoInteracoes: boolean;
  novaInteracao: {
    tipo: "email" | "ligacao" | "reuniao" | "mensagem" | "whatsapp" | "telegram" | "instagram" | "facebook" | "outro";
    descricao: string;
    data: Date;
    responsavelId: string;
  };
  handleInteracaoChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleInteracaoSelectChange: (name: string, value: string) => void;
  handleInteracaoDataChange: (date: Date) => void;
  adicionarInteracao: () => void;
  vendedoresAtivos: Usuario[];
  getNomeResponsavel: (id: string) => string;
}

export function InteracoesTab({
  lead,
  interacoes,
  carregandoInteracoes,
  novaInteracao,
  handleInteracaoChange,
  handleInteracaoSelectChange,
  handleInteracaoDataChange,
  adicionarInteracao,
  vendedoresAtivos,
  getNomeResponsavel
}: InteracoesTabProps) {
  const [interacaoSelecionada, setInteracaoSelecionada] = useState<LeadInteracao | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [interacaoEditavel, setInteracaoEditavel] = useState<LeadInteracao | null>(null);

  // Função para visualizar detalhes de uma interação
  const visualizarInteracao = (interacao: LeadInteracao) => {
    setInteracaoSelecionada(interacao);
    setIsViewDialogOpen(true);
  };

  // Função para editar uma interação
  const prepararEdicaoInteracao = (interacao: LeadInteracao) => {
    setInteracaoEditavel({...interacao});
    setIsEditDialogOpen(true);
  };

  // Função para abrir o diálogo de confirmação de exclusão
  const prepararExclusaoInteracao = (interacao: LeadInteracao) => {
    setInteracaoSelecionada(interacao);
    setIsDeleteDialogOpen(true);
  };

  // Handler para mudanças no formulário de edição de interação
  const handleInteracaoEditavelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (interacaoEditavel) {
      setInteracaoEditavel(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  // Handler para seleção no formulário de edição de interação
  const handleInteracaoEditavelSelectChange = (name: string, value: string) => {
    if (interacaoEditavel) {
      setInteracaoEditavel(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="space-y-6">
        {lead ? (
          <>
            {/* Formulário para nova interação */}
            <NovaInteracaoForm
              novaInteracao={novaInteracao}
              handleInteracaoChange={handleInteracaoChange}
              handleInteracaoSelectChange={handleInteracaoSelectChange}
              handleInteracaoDataChange={handleInteracaoDataChange}
              adicionarInteracao={adicionarInteracao}
              vendedoresAtivos={vendedoresAtivos}
            />

            {/* Lista de interações existentes */}
            <div>
              <h3 className="text-lg font-medium mb-4">Histórico de Interações</h3>
              {carregandoInteracoes ? (
                <div className="text-center py-6">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Carregando interações...</p>
                </div>
              ) : interacoes.length > 0 ? (
                <InteracoesTable
                  interacoes={interacoes}
                  onView={visualizarInteracao}
                  onEdit={prepararEdicaoInteracao}
                  onDelete={prepararExclusaoInteracao}
                  getNomeResponsavel={getNomeResponsavel}
                />
              ) : (
                <div className="text-center py-6 text-muted-foreground border rounded-md">
                  Nenhuma interação registrada.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            As interações estarão disponíveis após criar o lead.
          </div>
        )}
      </div>

      {/* Diálogos para visualizar/editar/excluir interações */}
      <InteracaoViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        interacao={interacaoSelecionada}
        onEdit={() => {
          if (interacaoSelecionada) {
            prepararEdicaoInteracao(interacaoSelecionada);
          }
        }}
        getNomeResponsavel={getNomeResponsavel}
      />

      <InteracaoEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        interacao={interacaoEditavel}
        onInteracaoChange={handleInteracaoEditavelChange}
        onInteracaoSelectChange={handleInteracaoEditavelSelectChange}
        onSave={() => {
          if (interacaoEditavel) {
            // Chamada para salvar as alterações passada via props
            if (typeof window !== 'undefined') {
              // Este é um placeholder, a função real será passada pelo componente pai
              console.log("Salvando interação editada", interacaoEditavel);
            }
            setIsEditDialogOpen(false);
          }
        }}
        vendedoresAtivos={vendedoresAtivos}
      />
      
      <InteracaoDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={() => {
          if (typeof window !== 'undefined') {
            // Este é um placeholder, a função real será passada pelo componente pai
            console.log("Excluindo interação", interacaoSelecionada);
          }
          setIsDeleteDialogOpen(false);
        }}
      />
    </div>
  );
}
