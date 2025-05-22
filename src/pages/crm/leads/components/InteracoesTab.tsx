
import React, { useState } from "react";
import { NovaInteracaoForm } from "./NovaInteracaoForm";
import { InteracoesTable } from "./InteracoesTable";
import { InteracaoEditDialog } from "./InteracaoEditDialog";
import { InteracaoViewDialog } from "./InteracaoViewDialog";
import { InteracaoDeleteDialog } from "./InteracaoDeleteDialog";
import { LeadInteracao } from "../types";
import { Usuario } from "@/types";

interface InteracoesTabProps {
  lead: any;
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
  excluirInteracao?: (id: string | number) => void;
  confirmarEdicaoInteracao?: (interacao: LeadInteracao) => void;
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
  excluirInteracao,
  confirmarEdicaoInteracao,
  vendedoresAtivos,
  getNomeResponsavel
}: InteracoesTabProps) {
  const [interacaoParaVisualizar, setInteracaoParaVisualizar] = useState<LeadInteracao | null>(null);
  const [interacaoParaEditar, setInteracaoParaEditar] = useState<LeadInteracao | null>(null);
  const [interacaoParaExcluir, setInteracaoParaExcluir] = useState<LeadInteracao | null>(null);

  const [openVisualizarDialog, setOpenVisualizarDialog] = useState(false);
  const [openEditarDialog, setOpenEditarDialog] = useState(false);
  const [openExcluirDialog, setOpenExcluirDialog] = useState(false);

  const handleVerInteracao = (interacao: LeadInteracao) => {
    setInteracaoParaVisualizar(interacao);
    setOpenVisualizarDialog(true);
  };

  const handleEditarInteracao = (interacao: LeadInteracao) => {
    setInteracaoParaEditar({...interacao});
    setOpenEditarDialog(true);
  };

  const handleExcluirInteracao = (interacao: LeadInteracao) => {
    setInteracaoParaExcluir(interacao);
    setOpenExcluirDialog(true);
  };

  const handleInteracaoEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!interacaoParaEditar) return;
    const { name, value } = e.target;
    setInteracaoParaEditar(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleInteracaoEditSelectChange = (name: string, value: string) => {
    if (!interacaoParaEditar) return;
    setInteracaoParaEditar(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleInteracaoEditDateChange = (date: Date) => {
    if (!interacaoParaEditar) return;
    setInteracaoParaEditar(prev => prev ? { ...prev, data: date } : null);
  };

  const handleSalvarEdicao = () => {
    if (interacaoParaEditar && confirmarEdicaoInteracao) {
      confirmarEdicaoInteracao(interacaoParaEditar);
      setOpenEditarDialog(false);
    }
  };

  const handleConfirmarExclusao = () => {
    if (interacaoParaExcluir && excluirInteracao && interacaoParaExcluir.id) {
      excluirInteracao(interacaoParaExcluir.id);
      setOpenExcluirDialog(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6">
        {lead?.id && (
          <NovaInteracaoForm
            novaInteracao={novaInteracao}
            handleInteracaoChange={handleInteracaoChange}
            handleInteracaoSelectChange={handleInteracaoSelectChange}
            handleInteracaoDataChange={handleInteracaoDataChange}
            adicionarInteracao={adicionarInteracao}
            vendedoresAtivos={vendedoresAtivos}
            leadTelefone={lead.telefone} // Passamos o telefone do lead
          />
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 pt-0">
        <InteracoesTable
          interacoes={interacoes}
          carregandoInteracoes={carregandoInteracoes}
          onVerInteracao={handleVerInteracao}
          onEditarInteracao={handleEditarInteracao}
          onExcluirInteracao={handleExcluirInteracao}
        />
      </div>
      
      {/* Dialogs */}
      <InteracaoViewDialog
        open={openVisualizarDialog}
        onOpenChange={setOpenVisualizarDialog}
        interacao={interacaoParaVisualizar}
      />
      
      <InteracaoEditDialog
        open={openEditarDialog}
        onOpenChange={setOpenEditarDialog}
        interacao={interacaoParaEditar}
        onInteracaoChange={handleInteracaoEditChange}
        onInteracaoSelectChange={handleInteracaoEditSelectChange}
        onInteracaoDateChange={handleInteracaoEditDateChange}
        onSave={handleSalvarEdicao}
        vendedoresAtivos={vendedoresAtivos}
      />
      
      <InteracaoDeleteDialog
        open={openExcluirDialog}
        onOpenChange={setOpenExcluirDialog}
        interacao={interacaoParaExcluir}
        onConfirm={handleConfirmarExclusao}
      />
    </div>
  );
}
