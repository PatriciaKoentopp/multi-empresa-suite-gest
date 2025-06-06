
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TabelaPreco, Servico, Produto } from '@/types';
import { useCompany } from '@/contexts/company-context';
import { toast } from '@/hooks/use-toast';
import { TabelaPrecoModal } from './tabela-preco-modal';
import { TabelaPrecoList } from './tabela-preco-list';

export default function TabelaPrecosPage() {
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTabela, setEditingTabela] = useState<TabelaPreco | null>(null);
  const [modo, setModo] = useState<"visualizar" | "editar" | "novo">("novo");
  const { currentCompany } = useCompany();

  const fetchTabelas = async () => {
    if (!currentCompany?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tabelas_precos')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('nome');

      if (error) throw error;

      // Converter tipos Date corretamente e aceitar status string
      const tabelasFormatadas = (data || []).map(tabela => ({
        ...tabela,
        vigencia_inicial: tabela.vigencia_inicial ? new Date(tabela.vigencia_inicial) : null,
        vigencia_final: tabela.vigencia_final ? new Date(tabela.vigencia_final) : null,
        created_at: new Date(tabela.created_at),
        updated_at: new Date(tabela.updated_at),
        status: tabela.status as string
      }));

      setTabelas(tabelasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar tabelas de preço:', error);
      toast({
        title: "Erro ao carregar tabelas",
        description: "Não foi possível carregar a lista de tabelas de preço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServicos = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      // Converter tipos Date corretamente
      const servicosFormatados = (data || []).map(servico => ({
        ...servico,
        created_at: new Date(servico.created_at).toISOString(),
        updated_at: new Date(servico.updated_at).toISOString(),
        status: servico.status as string
      }));

      setServicos(servicosFormatados);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar a lista de serviços.",
        variant: "destructive",
      });
    }
  };

  const fetchProdutos = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      // Converter tipos Date corretamente
      const produtosFormatados = (data || []).map(produto => ({
        ...produto,
        created_at: new Date(produto.created_at).toISOString(),
        updated_at: new Date(produto.updated_at).toISOString(),
        status: produto.status as string
      }));

      setProdutos(produtosFormatados);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (currentCompany?.id) {
      fetchTabelas();
      fetchServicos();
      fetchProdutos();
    }
  }, [currentCompany?.id]);

  const handleEdit = (tabela: TabelaPreco) => {
    setEditingTabela(tabela);
    setModo("editar");
    setIsModalOpen(true);
  };

  const handleNewTabela = () => {
    setEditingTabela(null);
    setModo("novo");
    setIsModalOpen(true);
  };

  const handleSuccess = (tabela: TabelaPreco) => {
    setIsModalOpen(false);
    setEditingTabela(null);
    fetchTabelas();
    
    toast({
      title: "Tabela salva com sucesso",
      description: "A tabela de preços foi salva com sucesso.",
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingTabela(null);
  };

  const handleDelete = async (tabelaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tabela de preços?')) return;

    try {
      const { error } = await supabase
        .from('tabelas_precos')
        .update({ status: 'inativo' })
        .eq('id', tabelaId);

      if (error) throw error;

      toast({
        title: "Tabela excluída",
        description: "A tabela de preços foi excluída com sucesso.",
      });

      fetchTabelas();
    } catch (error) {
      console.error('Erro ao excluir tabela:', error);
      toast({
        title: "Erro ao excluir tabela",
        description: "Não foi possível excluir a tabela de preços.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tabelas de Preços</h1>
          <p className="text-gray-600">Gerencie suas tabelas de preços</p>
        </div>
        
        <Button onClick={handleNewTabela} variant="blue">
          <Plus className="mr-2 h-4 w-4" />
          Nova Tabela
        </Button>
      </div>

      <TabelaPrecoList
        tabelas={tabelas}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TabelaPrecoModal
        open={isModalOpen}
        onClose={handleCancel}
        tabela={editingTabela}
        servicosACadastrar={servicos}
        produtosACadastrar={produtos}
        modo={modo}
        onSalvar={handleSuccess}
      />
    </div>
  );
}
