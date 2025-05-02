
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompany } from "@/contexts/company-context";
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { BanknoteIcon, CalendarX, CreditCard, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContaReceber } from "@/components/contas-a-receber/contas-a-receber-table";
import { ContaCorrente } from "@/types/conta-corrente";

interface DashboardData {
  totalVendas: number;
  contasReceber: number;
  contasPagar: number;
  novosClientes: number;
  ultimasVendas: {
    favorecido: string;
    codigo: string;
    valor: number;
    data: string;
  }[];
  parcelasEmAtraso: ContaReceber[];
  saldoContas: {
    nome: string;
    saldo: number;
    id: string;
  }[];
  totalSaldo: number;
}

export function Dashboard() {
  const {
    currentCompany
  } = useCompany();
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalVendas: 0,
    contasReceber: 0,
    contasPagar: 0,
    novosClientes: 0,
    ultimasVendas: [],
    parcelasEmAtraso: [],
    saldoContas: [],
    totalSaldo: 0
  });

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setIsLoading(true);
        if (!currentCompany?.id) return;

        // Data atual e primeiro dia do mês
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

        // Formato para o Supabase: YYYY-MM-DD
        const hojeFormatado = format(hoje, 'yyyy-MM-dd');
        const inicioMesFormatado = format(inicioMes, 'yyyy-MM-dd');
        const inicioMesAnteriorFormatado = format(inicioMesAnterior, 'yyyy-MM-dd');

        // 1. Buscar contas correntes e seus saldos
        const { data: contasCorrentes, error: erroContasCorrentes } = await supabase
          .from('contas_correntes')
          .select('*')
          .eq('empresa_id', currentCompany.id)
          .eq('status', 'ativo');

        if (erroContasCorrentes) throw erroContasCorrentes;

        // Contas com saldos iniciais
        const saldoContas = [];
        let totalSaldo = 0;

        if (contasCorrentes && contasCorrentes.length > 0) {
          // Para cada conta, buscar TODAS as movimentações ordenadas por data
          for (const conta of contasCorrentes) {
            const { data: movimentacoes, error: erroMovimentacoes } = await supabase
              .from('fluxo_caixa')
              .select('*')
              .eq('conta_corrente_id', conta.id)
              .eq('empresa_id', currentCompany.id)
              .order('data_movimentacao', { ascending: true });

            if (erroMovimentacoes) throw erroMovimentacoes;

            // Calcular o saldo como na página de fluxo de caixa
            let saldoAtual = Number(conta.saldo_inicial || 0);

            if (movimentacoes && movimentacoes.length > 0) {
              // Somar todas as movimentações ordenadas cronologicamente
              for (const mov of movimentacoes) {
                saldoAtual += Number(mov.valor);
              }
            }

            saldoContas.push({
              id: conta.id,
              nome: conta.nome,
              saldo: saldoAtual
            });

            totalSaldo += saldoAtual;
          }
        }
        
        // 1. Buscar total de vendas do mês atual
        const {
          data: vendas,
          error: erroVendas
        } = await supabase.from('orcamentos').select(`
            id,
            orcamentos_itens (valor)
          `).eq('empresa_id', currentCompany.id).eq('tipo', 'venda').eq('status', 'ativo').gte('data_venda', inicioMesFormatado);
        if (erroVendas) throw erroVendas;
        const totalVendas = vendas?.reduce((acc, orcamento) => {
          const valorOrcamento = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
          return acc + valorOrcamento;
        }, 0) || 0;

        // 2. Buscar contas a receber em aberto
        const {
          data: contasReceber,
          error: erroContasReceber
        } = await supabase.from('movimentacoes_parcelas').select(`
            id,
            valor,
            data_vencimento,
            movimentacao:movimentacao_id(
              tipo_operacao,
              favorecido_id,
              empresa_id
            )
          `).is('data_pagamento', null).eq('movimentacao.tipo_operacao', 'receber').eq('movimentacao.empresa_id', currentCompany.id);
        if (erroContasReceber) throw erroContasReceber;
        const totalContasReceber = contasReceber?.reduce((acc, conta) => acc + (Number(conta.valor) || 0), 0) || 0;

        // Filtrar parcelas em atraso
        const parcelasEmAtraso: ContaReceber[] = [];

        if (contasReceber && contasReceber.length > 0) {
          const parcelasAtrasadas = contasReceber.filter(parcela => new Date(parcela.data_vencimento) < hoje && parcela.movimentacao?.tipo_operacao === 'receber');
          if (parcelasAtrasadas.length > 0) {
            // Buscar IDs dos favorecidos únicos
            const favorecidoIds = [...new Set(parcelasAtrasadas.map(p => p.movimentacao?.favorecido_id).filter(Boolean))];

            // Buscar dados dos favorecidos
            const {
              data: favorecidos
            } = await supabase.from('favorecidos').select('id, nome').in('id', favorecidoIds);
            const favorecidosMap = new Map();
            if (favorecidos) {
              favorecidos.forEach(fav => favorecidosMap.set(fav.id, fav.nome));
            }

            // Buscar informações das movimentações (para descrição)
            const movimentacaoIds = [...new Set(parcelasAtrasadas.map(p => p.movimentacao_id))];
            const {
              data: movimentacoes
            } = await supabase.from('movimentacoes').select('id, descricao, numero_documento').in('id', movimentacaoIds);
            const movimentacoesMap = new Map();
            if (movimentacoes) {
              movimentacoes.forEach(mov => movimentacoesMap.set(mov.id, {
                descricao: mov.descricao,
                numeroDocumento: mov.numero_documento
              }));
            }

            // Montar as parcelas em atraso com todos os dados necessários
            parcelasEmAtraso.push(...parcelasAtrasadas.map(parcela => {
              const favorecidoNome = favorecidosMap.get(parcela.movimentacao?.favorecido_id) || 'Desconhecido';
              const movInfo = movimentacoesMap.get(parcela.movimentacao_id);
              return {
                id: parcela.id,
                cliente: favorecidoNome,
                descricao: movInfo?.descricao || 'Sem descrição',
                dataVencimento: new Date(parcela.data_vencimento),
                valor: Number(parcela.valor),
                status: 'em_aberto' as 'em_aberto',
                // Tipagem explícita
                numeroParcela: movInfo?.numeroDocumento || '-',
                origem: 'Movimentação',
                movimentacao_id: parcela.movimentacao_id
              };
            }));
          }
        }

        // 3. Buscar contas a pagar em aberto
        const {
          data: contasPagar,
          error: erroContasPagar
        } = await supabase.from('movimentacoes_parcelas').select(`
            id,
            valor,
            movimentacao:movimentacao_id(
              tipo_operacao,
              empresa_id
            )
          `).is('data_pagamento', null).eq('movimentacao.tipo_operacao', 'pagar').eq('movimentacao.empresa_id', currentCompany.id);
        if (erroContasPagar) throw erroContasPagar;

        // Calculando corretamente o total das contas a pagar
        const totalContasPagar = contasPagar?.reduce((acc, conta) => {
          // Verificando se é realmente uma conta a pagar
          if (conta.movimentacao?.tipo_operacao === 'pagar') {
            return acc + (Number(conta.valor) || 0);
          }
          return acc;
        }, 0) || 0;

        // 4. Buscar novos clientes (cadastrados no mês atual)
        const {
          data: grupoClientes,
          error: erroGrupoClientes
        } = await supabase.from('grupo_favorecidos').select('id').eq('empresa_id', currentCompany.id).eq('nome', 'Clientes').eq('status', 'ativo').limit(1);
        if (erroGrupoClientes) throw erroGrupoClientes;
        let quantidadeNovosClientes = 0;
        if (grupoClientes && grupoClientes.length > 0) {
          const grupoClienteId = grupoClientes[0].id;

          // Agora buscamos os favorecidos filtrados pelo grupo_id
          const {
            data: novosClientes,
            error: erroNovosClientes
          } = await supabase.from('favorecidos').select('id').eq('empresa_id', currentCompany.id).eq('grupo_id', grupoClienteId).gte('created_at', inicioMesFormatado);
          if (erroNovosClientes) throw erroNovosClientes;
          quantidadeNovosClientes = novosClientes?.length || 0;
        } else {
          // Caso não encontre o grupo "Clientes", vamos fazer um log e mostrar 0
          console.warn("Grupo 'Clientes' não encontrado na tabela grupo_favorecidos");
        }

        // 5. Buscar últimas vendas
        const {
          data: ultimasVendas,
          error: erroUltimasVendas
        } = await supabase.from('orcamentos').select(`
            codigo,
            data_venda,
            favorecido:favorecido_id(nome),
            orcamentos_itens(valor)
          `).eq('empresa_id', currentCompany.id).eq('tipo', 'venda').eq('status', 'ativo').order('data_venda', {
          ascending: false
        }).limit(3);
        if (erroUltimasVendas) throw erroUltimasVendas;
        const vendasFormatadas = ultimasVendas?.map(venda => {
          const totalVenda = venda.orcamentos_itens.reduce((acc: number, item: any) => acc + (Number(item.valor) || 0), 0);
          return {
            favorecido: venda.favorecido?.nome || 'Cliente não identificado',
            codigo: venda.codigo,
            valor: totalVenda,
            data: venda.data_venda ? format(new Date(venda.data_venda), 'dd/MM/yyyy') : '-'
          };
        }) || [];

        // Atualizar o estado com todos os dados obtidos
        setDashboardData({
          totalVendas,
          contasReceber: totalContasReceber,
          contasPagar: totalContasPagar,
          novosClientes: quantidadeNovosClientes,
          ultimasVendas: vendasFormatadas,
          parcelasEmAtraso,
          saldoContas,
          totalSaldo
        });
        setIsLoading(false);
      } catch (error: any) {
        console.error("Erro ao carregar dados do dashboard:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: error.message || "Não foi possível carregar os dados do dashboard"
        });
        setIsLoading(false);
      }
    };
    fetchDados();
  }, [currentCompany?.id, toast]);

  return <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da empresa {currentCompany?.nomeFantasia || ""}
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SalesDashboardCard title="Vendas do Mês" value={formatCurrency(dashboardData.totalVendas)} description="Total do mês atual" icon="money" />
        <SalesDashboardCard title="Contas a Receber" value={formatCurrency(dashboardData.contasReceber)} description={`${dashboardData.parcelasEmAtraso.length} título(s) em atraso`} icon="chart" />
        <SalesDashboardCard title="Contas a Pagar" value={formatCurrency(dashboardData.contasPagar)} description="Pagamentos pendentes" icon="sales" />
        <SalesDashboardCard title="Novos Clientes" value={`+${dashboardData.novosClientes}`} description="Novos cadastros no mês" icon="users" />
      </div>

      {/* Card para Saldo das Contas */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" /> 
            Saldo das Contas
          </CardTitle>
          <CardDescription>
            Saldo atual em todas as contas correntes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : dashboardData.saldoContas.length > 0 ? (
            <div className="space-y-4">
              {/* Total geral */}
              <div className="flex items-center justify-between border-b pb-2">
                <p className="font-semibold text-lg">Saldo Total</p>
                <p className={`font-bold text-lg ${dashboardData.totalSaldo > 0 ? 'text-green-600' : dashboardData.totalSaldo < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatCurrency(dashboardData.totalSaldo)}
                </p>
              </div>
              
              {/* Lista de contas */}
              <div className="space-y-2">
                {dashboardData.saldoContas.map(conta => (
                  <div key={conta.id} className="flex items-center justify-between">
                    <p className="text-gray-800">{conta.nome}</p>
                    <p className={conta.saldo > 0 ? 'text-green-600' : conta.saldo < 0 ? 'text-red-600' : 'text-gray-800'}>
                      {formatCurrency(conta.saldo)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma conta corrente encontrada
            </p>
          )}
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Últimas Vendas</CardTitle>
            
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div> : dashboardData.ultimasVendas.length > 0 ? dashboardData.ultimasVendas.map((venda, index) => <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{venda.favorecido}</p>
                      <p className="text-sm text-muted-foreground">Pedido #{venda.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(venda.valor)}</p>
                      <p className="text-sm text-muted-foreground">{venda.data}</p>
                    </div>
                  </div>) : <p className="text-center text-muted-foreground py-4">
                  Nenhuma venda encontrada
                </p>}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarX className="h-5 w-5 text-red-500" /> 
              Parcelas em Atraso
            </CardTitle>
            
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div> : dashboardData.parcelasEmAtraso.length > 0 ? dashboardData.parcelasEmAtraso.slice(0, 3).map(parcela => <div key={parcela.id} className="flex items-start gap-4">
                    <div className="mt-1 h-4 w-4 rounded-full bg-red-100 border border-red-500"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{parcela.cliente}</p>
                        <p className="text-red-600 font-medium">{formatCurrency(parcela.valor)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Vencimento: {format(new Date(parcela.dataVencimento), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {parcela.numeroParcela}
                        </p>
                      </div>
                    </div>
                  </div>) : <p className="text-center text-muted-foreground py-4">
                  Nenhuma parcela em atraso
                </p>}
              
              {dashboardData.parcelasEmAtraso.length > 3 && <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    + {dashboardData.parcelasEmAtraso.length - 3} outras parcelas em atraso
                  </p>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
export default Dashboard;
