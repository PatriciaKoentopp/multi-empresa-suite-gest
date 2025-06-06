
import React, { useState, useEffect } from "react";
import { InteracoesTab } from "./InteracoesTab";
import { LeadInteracao, LeadFormData } from "../types";
import { Usuario } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

interface InteracoesTabWrapperProps {
  lead: LeadFormData;
}

export function InteracoesTabWrapper({ lead }: InteracoesTabWrapperProps) {
  const [interacoes, setInteracoes] = useState<LeadInteracao[]>([]);
  const [carregandoInteracoes, setCarregandoInteracoes] = useState(false);
  const [vendedoresAtivos, setVendedoresAtivos] = useState<Usuario[]>([]);
  const { currentCompany } = useCompany();
  
  const [novaInteracao, setNovaInteracao] = useState({
    tipo: "email" as const,
    descricao: "",
    data: new Date(),
    responsavelId: ""
  });

  useEffect(() => {
    if (lead.id) {
      carregarInteracoes();
      carregarVendedores();
    }
  }, [lead.id]);

  const carregarInteracoes = async () => {
    if (!lead.id) return;
    
    setCarregandoInteracoes(true);
    try {
      const { data, error } = await supabase
        .from('leads_interacoes')
        .select('*')
        .eq('lead_id', lead.id)
        .order('data', { ascending: false });

      if (error) throw error;

      const interacoesFormatadas: LeadInteracao[] = (data || []).map(item => ({
        id: item.id,
        leadId: item.lead_id,
        tipo: item.tipo as LeadInteracao['tipo'],
        descricao: item.descricao,
        data: item.data,
        responsavelId: item.responsavel_id || '',
        status: item.status
      }));

      setInteracoes(interacoesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar interações:', error);
      toast.error('Erro ao carregar interações');
    } finally {
      setCarregandoInteracoes(false);
    }
  };

  const carregarVendedores = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo');

      if (error) throw error;

      const usuariosFormatados: Usuario[] = (data || []).map(user => ({
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        vendedor: user.vendedor,
        status: user.status,
        empresa_id: user.empresa_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));

      setVendedoresAtivos(usuariosFormatados);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
    }
  };

  const handleInteracaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNovaInteracao(prev => ({ ...prev, [name]: value }));
  };

  const handleInteracaoSelectChange = (name: string, value: string) => {
    setNovaInteracao(prev => ({ ...prev, [name]: value }));
  };

  const handleInteracaoDataChange = (date: Date) => {
    setNovaInteracao(prev => ({ ...prev, data: date }));
  };

  const adicionarInteracao = async () => {
    if (!lead.id || !novaInteracao.descricao.trim() || !novaInteracao.responsavelId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('leads_interacoes')
        .insert({
          lead_id: lead.id,
          tipo: novaInteracao.tipo,
          descricao: novaInteracao.descricao,
          data: novaInteracao.data.toISOString().split('T')[0],
          responsavel_id: novaInteracao.responsavelId,
          status: 'Aberto'
        });

      if (error) throw error;

      toast.success('Interação adicionada com sucesso!');
      
      // Resetar formulário
      setNovaInteracao({
        tipo: "email",
        descricao: "",
        data: new Date(),
        responsavelId: ""
      });

      // Recarregar interações
      carregarInteracoes();
    } catch (error) {
      console.error('Erro ao adicionar interação:', error);
      toast.error('Erro ao adicionar interação');
    }
  };

  const excluirInteracao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads_interacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Interação excluída com sucesso!');
      carregarInteracoes();
    } catch (error) {
      console.error('Erro ao excluir interação:', error);
      toast.error('Erro ao excluir interação');
    }
  };

  const confirmarEdicaoInteracao = async (interacao: LeadInteracao) => {
    try {
      const { error } = await supabase
        .from('leads_interacoes')
        .update({
          tipo: interacao.tipo,
          descricao: interacao.descricao,
          data: typeof interacao.data === 'string' ? interacao.data : interacao.data.toISOString().split('T')[0],
          responsavel_id: interacao.responsavelId
        })
        .eq('id', interacao.id);

      if (error) throw error;

      toast.success('Interação atualizada com sucesso!');
      carregarInteracoes();
    } catch (error) {
      console.error('Erro ao atualizar interação:', error);
      toast.error('Erro ao atualizar interação');
    }
  };

  const getNomeResponsavel = (id: string) => {
    const vendedor = vendedoresAtivos.find(v => v.id === id);
    return vendedor?.nome || 'Não informado';
  };

  return (
    <InteracoesTab
      lead={lead}
      interacoes={interacoes}
      carregandoInteracoes={carregandoInteracoes}
      novaInteracao={novaInteracao}
      handleInteracaoChange={handleInteracaoChange}
      handleInteracaoSelectChange={handleInteracaoSelectChange}
      handleInteracaoDataChange={handleInteracaoDataChange}
      adicionarInteracao={adicionarInteracao}
      excluirInteracao={excluirInteracao}
      confirmarEdicaoInteracao={confirmarEdicaoInteracao}
      vendedoresAtivos={vendedoresAtivos}
      getNomeResponsavel={getNomeResponsavel}
    />
  );
}
