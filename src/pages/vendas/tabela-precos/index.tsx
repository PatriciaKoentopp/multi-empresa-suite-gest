
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter } from "lucide-react";
import { TabelaPrecoCard } from "./tabela-preco-card";
import { TabelaPrecoModal } from "./tabela-preco-modal";
import { toast } from "@/hooks/use-toast";

type Servico = { id: number; nome: string; precoPadrao: number };
type Vigencia = { dataInicial: Date | null; dataFinal: Date | null };
type TabelaPreco = {
  id: number;
  nome: string;
  vigencia: Vigencia;
  servicos: { servicoId: number; nome: string; preco: number }[];
};

// Mock dos serviços (como na página de serviços)
const MOCK_SERVICOS: Servico[] = [
  { id: 1, nome: "Consultoria Fiscal", precoPadrao: 700 },
  { id: 2, nome: "Auditoria Contábil", precoPadrao: 3500 },
  { id: 3, nome: "Abertura de Empresa", precoPadrao: 1200 },
  { id: 4, nome: "Encerramento de Empresa", precoPadrao: 950 },
  { id: 5, nome: "BPO Financeiro", precoPadrao: 2500 },
  { id: 6, nome: "Elaboração de Contrato Social", precoPadrao: 890 },
];

// Mock inicial de tabelas de preço exemplo
const MOCK_TABELAS: TabelaPreco[] = [
  {
    id: 200,
    nome: "Tabela 2025",
    vigencia: { dataInicial: new Date(2025, 0, 1), dataFinal: new Date(2025, 11, 31) },
    servicos: [
      { servicoId: 1, nome: "Consultoria Fiscal", preco: 710 },
      { servicoId: 2, nome: "Auditoria Contábil", preco: 3500 },
    ],
  },
  {
    id: 201,
    nome: "Tabela Promocional",
    vigencia: { dataInicial: new Date(2024, 6, 1), dataFinal: new Date(2024, 9, 30) },
    servicos: [
      { servicoId: 3, nome: "Abertura de Empresa", preco: 1100 },
      { servicoId: 5, nome: "BPO Financeiro", preco: 2300 },
    ],
  },
  {
    id: 202,
    nome: "Tabela Especial Empresas",
    vigencia: { dataInicial: new Date(2024, 2, 10), dataFinal: new Date(2024, 5, 15) },
    servicos: [
      { servicoId: 4, nome: "Encerramento de Empresa", preco: 900 },
      { servicoId: 6, nome: "Elaboração de Contrato Social", preco: 968 },
    ],
  },
];

export default function TabelaPrecosPage() {
  // Estado para as tabelas de preço cadastradas
  const [tabelas, setTabelas] = useState<TabelaPreco[]>(MOCK_TABELAS);
  // Filtros
  const [searchNome, setSearchNome] = useState("");
  // Modal/estado de detalhe ou edição
  const [modalAberto, setModalAberto] = useState(false);
  const [modoModal, setModoModal] = useState<"visualizar" | "editar" | "novo">("visualizar");
  const [tabelaSelecionada, setTabelaSelecionada] = useState<TabelaPreco | null>(null);

  // Filtrar pelo nome da tabela (outros filtros podem ser adicionados)
  const tabelasFiltradas = useMemo(() => {
    return tabelas.filter(tab =>
      tab.nome.toLocaleLowerCase().includes(searchNome.toLocaleLowerCase())
    );
  }, [tabelas, searchNome]);

  function abrirNovo() {
    setTabelaSelecionada(null);
    setModoModal("novo");
    setModalAberto(true);
  }

  function abrirVisualizar(tabela: TabelaPreco) {
    setTabelaSelecionada(tabela);
    setModoModal("visualizar");
    setModalAberto(true);
  }

  function abrirEditar(tabela: TabelaPreco) {
    setTabelaSelecionada(tabela);
    setModoModal("editar");
    setModalAberto(true);
  }

  function handleSalvarTabela(tab: TabelaPreco) {
    if (modoModal === "editar" && tab.id) {
      setTabelas(prev => prev.map(tb => (tb.id === tab.id ? { ...tab } : tb)));
      toast({ title: "Tabela de Preços atualizada com sucesso!" });
    } else {
      setTabelas(prev => [
        ...prev,
        {
          ...tab,
          id: Date.now(),
        },
      ]);
      toast({ title: "Tabela de Preços criada com sucesso!" });
    }
  }

  function handleExcluirTabela(tab: TabelaPreco) {
    setTabelas(prev => prev.filter(tb => tb.id !== tab.id));
    toast({ title: "Tabela excluída com sucesso!" });
  }

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Tabelas de Preço</h2>
        <Button
          variant="blue"
          size="sm"
          className="flex gap-1"
          onClick={abrirNovo}
          title="Nova Tabela de Preços"
        >
          <Plus className="w-4 h-4" /> Nova Tabela
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-center gap-2 bg-muted p-4 rounded-lg mb-4">
        <div className="flex gap-2 items-center w-full md:max-w-xs">
          <Filter className="text-blue-400" />
          <Input
            placeholder="Filtrar por nome..."
            value={searchNome}
            onChange={e => setSearchNome(e.target.value)}
            className="bg-white text-base"
          />
        </div>
        {/* Espaço para mais filtros */}
      </div>

      {/* Listagem de tabelas (cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tabelasFiltradas.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Nenhuma tabela encontrada.
          </div>
        )}
        {tabelasFiltradas.map(tab => (
          <TabelaPrecoCard
            key={tab.id}
            tabela={tab}
            onVisualizar={abrirVisualizar}
            onEditar={abrirEditar}
            onExcluir={handleExcluirTabela}
          />
        ))}
      </div>

      <TabelaPrecoModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        tabela={tabelaSelecionada}
        modo={modoModal}
        onSalvar={handleSalvarTabela}
        servicosACadastrar={MOCK_SERVICOS}
      />
    </div>
  );
}
