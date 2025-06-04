
import React, { useState } from "react";
import { NovaInteracaoForm } from "./NovaInteracaoForm";
import { InteracoesTable } from "./InteracoesTable";
import { InteracaoEditDialog } from "./InteracaoEditDialog";
import { InteracaoViewDialog } from "./InteracaoViewDialog";
import { InteracaoDeleteDialog } from "./InteracaoDeleteDialog";
import { LeadInteracao } from "../types";
import { Usuario } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  excluirInteracao?: (id: string) => void;
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
  // Adicionar um estado para gerenciar as interações localmente
  const [interacoesLocais, setInteracoesLocais] = useState<LeadInteracao[]>(interacoes);

  const [openVisualizarDialog, setOpenVisualizarDialog] = useState(false);
  const [openEditarDialog, setOpenEditarDialog] = useState(false);
  const [openExcluirDialog, setOpenExcluirDialog] = useState(false);

  // Atualizar o estado local quando as interações mudarem
  React.useEffect(() => {
    setInteracoesLocais(interacoes);
  }, [interacoes]);

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
    setInteracaoParaEditar(prev => prev ? { ...prev, data: date.toISOString().split('T')[0] } : null);
  };

  const handleSalvarEdicao = () => {
    if (interacaoParaEditar && confirmarEdicaoInteracao) {
      confirmarEdicaoInteracao(interacaoParaEditar);
      setOpenEditarDialog(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (interacaoParaExcluir && interacaoParaExcluir.id) {
      // Verificar se a interação tem status "Aberto" antes de excluir
      if (interacaoParaExcluir.status !== "Aberto") {
        toast.error("Não é possível excluir", {
          description: "Somente interações com status Aberto podem ser excluídas."
        });
        setOpenExcluirDialog(false);
        return;
      }
      
      try {
        // Fazer a exclusão no banco de dados
        const { error } = await supabase
          .from('leads_interacoes')
          .delete()
          .eq('id', interacaoParaExcluir.id);
        
        if (error) throw error;
        
        // Atualizar o estado local removendo a interação excluída
        setInteracoesLocais(atual => atual.filter(item => item.id !== interacaoParaExcluir.id));
        
        // Se tiver a função de excluir do prop, chamar também
        if (excluirInteracao) {
          excluirInteracao(interacaoParaExcluir.id);
        }
        
        toast.success("Interação excluída com sucesso");
      } catch (error) {
        console.error('Erro ao excluir interação:', error);
        toast.error("Erro ao excluir interação");
      }
      
      setOpenExcluirDialog(false);
    }
  };

  // Função para alternar o status da interação
  const handleToggleStatus = async (interacao: LeadInteracao) => {
    try {
      const novoStatus = interacao.status === "Realizado" ? "Aberto" : "Realizado";
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('leads_interacoes')
        .update({
          status: novoStatus
        })
        .eq('id', interacao.id);
      
      if (error) throw error;
      
      // Atualizar o estado local das interações
      setInteracoesLocais(atual => 
        atual.map(item => 
          item.id === interacao.id 
            ? { ...item, status: novoStatus } 
            : item
        )
      );
      
      // Notificar o usuário do sucesso
      toast.success(`Interação ${novoStatus === "Realizado" ? "concluída" : "reaberta"}`);
    } catch (error) {
      console.error('Erro ao atualizar status da interação:', error);
      toast.error("Erro ao atualizar status", {
        description: "Ocorreu um erro ao atualizar o status da interação."
      });
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
          interacoes={interacoesLocais} // Usar o estado local em vez do prop
          carregandoInteracoes={carregandoInteracoes}
          onVerInteracao={handleVerInteracao}
          onEditarInteracao={handleEditarInteracao}
          onExcluirInteracao={handleExcluirInteracao}
          onToggleStatus={handleToggleStatus}
          getNomeResponsavel={getNomeResponsavel}
        />
      </div>
      
      {/* Dialogs */}
      <InteracaoViewDialog
        open={openVisualizarDialog}
        onOpenChange={setOpenVisualizarDialog}
        interacao={interacaoParaVisualizar}
        onEdit={() => {
          if (interacaoParaVisualizar) {
            handleEditarInteracao(interacaoParaVisualizar);
            setOpenVisualizarDialog(false);
          }
        }}
        getNomeResponsavel={getNomeResponsavel}
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
        onDelete={handleConfirmarExclusao}
      />
    </div>
  );
}
