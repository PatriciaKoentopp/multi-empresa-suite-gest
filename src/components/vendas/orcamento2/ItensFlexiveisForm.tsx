
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Servico, Produto } from '@/types';
import { OrcamentoItem } from '@/types/orcamento';
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "@/components/ui/use-toast";

interface ItensFlexiveisFormProps {
  itens: OrcamentoItem[];
  servicosDisponiveis: Servico[];
  onItemChange: (idx: number, field: string, value: string | number) => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
  disabled?: boolean;
}

export function ItensFlexiveisForm({
  itens,
  servicosDisponiveis,
  onItemChange,
  onAddItem,
  onRemoveItem,
  disabled = false
}: ItensFlexiveisFormProps) {
  const { currentCompany } = useCompany();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tabelaPreco, setTabelaPreco] = useState<{ id: string, items: any[] } | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      carregarProdutos();
      carregarTabelaPrecoAtiva();
    }
  }, [currentCompany]);

  async function carregarProdutos() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      
      // Garantir que os produtos estejam no formato correto
      const produtosFormatados: Produto[] = data?.map(item => ({
        ...item,
        status: item.status === 'ativo' ? 'ativo' : 'inativo' // Garante que status seja "ativo" ou "inativo"
      })) || [];
      
      setProdutos(produtosFormatados);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function carregarTabelaPrecoAtiva() {
    try {
      // Buscar tabela de preço ativa com data de vigência atual
      const dataAtual = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('tabelas_precos')
        .select('id, nome')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo')
        .lte('vigencia_inicial', dataAtual)
        .or(`vigencia_final.gte.${dataAtual},vigencia_final.is.null`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        // Se encontrou uma tabela de preço ativa, buscar seus itens
        const tabelaId = data[0].id;
        
        const { data: itensTabela, error: itensError } = await supabase
          .from('tabelas_precos_itens')
          .select(`
            id, 
            preco, 
            servico_id, 
            produto_id
          `)
          .eq('tabela_id', tabelaId);

        if (itensError) throw itensError;

        setTabelaPreco({
          id: tabelaId,
          items: itensTabela || []
        });
        
        console.log('Tabela de preço carregada:', data[0].nome);
        console.log('Itens da tabela:', itensTabela?.length || 0);
      } else {
        console.log('Nenhuma tabela de preço ativa encontrada');
        setTabelaPreco(null);
      }
    } catch (error) {
      console.error('Erro ao carregar tabela de preço:', error);
    }
  }

  const handleTipoItemChange = (idx: number, tipo: "servico" | "produto") => {
    onItemChange(idx, "tipoItem", tipo);
    
    // Limpar os IDs quando o tipo muda
    if (tipo === "servico") {
      onItemChange(idx, "produtoId", "");
      if (servicosDisponiveis.length > 0) {
        const servicoId = servicosDisponiveis[0].id;
        onItemChange(idx, "servicoId", servicoId);
        
        // Buscar preço na tabela
        if (tabelaPreco) {
          const itemTabela = tabelaPreco.items.find(item => item.servico_id === servicoId);
          if (itemTabela) {
            onItemChange(idx, "valor", itemTabela.preco);
          }
        }
      }
    } else {
      onItemChange(idx, "servicoId", "");
      if (produtos.length > 0) {
        const produtoId = produtos[0].id;
        onItemChange(idx, "produtoId", produtoId);
        
        // Buscar preço na tabela
        if (tabelaPreco) {
          const itemTabela = tabelaPreco.items.find(item => item.produto_id === produtoId);
          if (itemTabela) {
            onItemChange(idx, "valor", itemTabela.preco);
          }
        }
      }
    }
  };

  const handleServicoOrProdutoChange = (idx: number, field: string, value: string) => {
    onItemChange(idx, field, value);
    
    // Buscar preço na tabela de preços
    if (tabelaPreco) {
      const itensTabelaPreco = tabelaPreco.items;
      const tipoItem = itens[idx].tipoItem;
      
      if (tipoItem === "servico" && field === "servicoId") {
        const itemTabela = itensTabelaPreco.find(item => item.servico_id === value);
        if (itemTabela) {
          onItemChange(idx, "valor", itemTabela.preco);
          toast({
            title: "Preço atualizado",
            description: `Preço obtido da tabela de preços ativa.`
          });
        }
      } else if (tipoItem === "produto" && field === "produtoId") {
        const itemTabela = itensTabelaPreco.find(item => item.produto_id === value);
        if (itemTabela) {
          onItemChange(idx, "valor", itemTabela.preco);
          toast({
            title: "Preço atualizado",
            description: `Preço obtido da tabela de preços ativa.`
          });
        }
      }
    }
  };

  return (
    <div>
      <label className="block text-sm mb-2 font-medium">Itens do Orçamento</label>
      <div className="flex flex-col gap-2">
        {itens.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-end">
            <div className="w-1/6">
              <Select
                value={item.tipoItem}
                onValueChange={(v) => handleTipoItemChange(idx, v as "servico" | "produto")}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="produto">Produto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              {item.tipoItem === "produto" ? (
                <Select
                  value={item.produtoId || ""}
                  onValueChange={v => handleServicoOrProdutoChange(idx, "produtoId", v)}
                  disabled={disabled || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map(produto => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={item.servicoId || ""}
                  onValueChange={v => handleServicoOrProdutoChange(idx, "servicoId", v)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicosDisponiveis.map(servico => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="w-[120px]"
              value={item.valor}
              onChange={e => onItemChange(idx, "valor", parseFloat(e.target.value) || 0)}
              placeholder="Valor"
              disabled={disabled}
            />
            {!disabled && itens.length > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onRemoveItem(idx)}
              >
                Remover
              </Button>
            )}
          </div>
        ))}
        {!disabled && (
          <Button
            type="button"
            variant="blue"
            onClick={onAddItem}
            className="mt-1"
          >
            <Plus className="mr-1 w-4 h-4" />
            Incluir Item
          </Button>
        )}
      </div>
    </div>
  );
}
