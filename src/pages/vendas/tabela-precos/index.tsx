import React, { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter, Edit, Trash2, Eye, MoreVertical, Search, Check, X } from "lucide-react";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { TabelaPrecoModal } from "./tabela-preco-modal";

// Tipos
type Servico = { id: number; nome: string; precoPadrao: number };
type Vigencia = { dataInicial: Date | null; dataFinal: Date | null };
type TabelaPreco = {
  id: number;
  nome: string;
  vigencia: Vigencia;
  servicos: { servicoId: number; nome: string; preco: number }[];
  status?: "ativo" | "inativo";
};

// Mock dos serviços (igual à página serviços)
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
    status: "ativo"
  },
  {
    id: 201,
    nome: "Tabela Promocional",
    vigencia: { dataInicial: new Date(2024, 6, 1), dataFinal: new Date(2024, 9, 30) },
    servicos: [
      { servicoId: 3, nome: "Abertura de Empresa", preco: 1100 },
      { servicoId: 5, nome: "BPO Financeiro", preco: 2300 },
    ],
    status: "ativo"
  },
  {
    id: 202,
    nome: "Tabela Especial Empresas",
    vigencia: { dataInicial: new Date(2024, 2, 10), dataFinal: new Date(2024, 5, 15) },
    servicos: [
      { servicoId: 4, nome: "Encerramento de Empresa", preco: 900 },
      { servicoId: 6, nome: "Elaboração de Contrato Social", preco: 968 },
    ],
    status: "ativo"
  },
];

export default function TabelaPrecosPage() {
  const [tabelas, setTabelas] = useState<TabelaPreco[]>(MOCK_TABELAS);
  const [searchNome, setSearchNome] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modoModal, setModoModal] = useState<"visualizar" | "editar" | "novo">("visualizar");
  const [tabelaSelecionada, setTabelaSelecionada] = useState<TabelaPreco | null>(null);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  // Filtro
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
          status: "ativo",  // Sempre ativa ao criar (pode ser ajustado depois)
        },
      ]);
      toast({ title: "Tabela de Preços criada com sucesso!" });
    }
  }

  function handleExcluirTabela(tab: TabelaPreco) {
    setTabelas(prev => prev.filter(tb => tb.id !== tab.id));
    toast({ title: "Tabela excluída com sucesso!" });
  }

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  // Função utilitária para exibir o badge de status no padrão da tela de serviços
  function getStatusBadge(status: "ativo" | "inativo" | undefined) {
    if (status === "ativo") {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
          Ativo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
        Inativo
      </span>
    );
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
          data-testid="botao-nova-tabela"
        >
          <Plus className="w-4 h-4" /> Nova Tabela
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-center gap-2 bg-muted p-4 rounded-lg mb-4">
        <div className="relative w-full md:max-w-xs">
          <button
            type="button"
            className="absolute left-3 top-2.5 z-10 p-0 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-blue-500"
            style={{ lineHeight: 0 }}
            onClick={handleLupaClick}
            tabIndex={-1}
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>
          <Input
            ref={inputBuscaRef}
            placeholder="Filtrar por nome..."
            value={searchNome}
            onChange={e => setSearchNome(e.target.value)}
            className="bg-white text-base pl-10"
          />
        </div>
        {/* Espaço para mais filtros no futuro */}
      </div>

      {/* Listagem em tabela */}
      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <thead>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Vigência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Qtd. Serviços</TableHead>
              <TableHead />
            </TableRow>
          </thead>
          <TableBody>
            {tabelasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma tabela encontrada.
                </TableCell>
              </TableRow>
            ) : (
              tabelasFiltradas.map(tab => (
                <TableRow key={tab.id}>
                  <TableCell className="font-semibold">{tab.nome}</TableCell>
                  <TableCell>
                    {tab.vigencia.dataInicial
                      ? tab.vigencia.dataInicial.toLocaleDateString("pt-BR")
                      : "-"}{" "}
                    até{" "}
                    {tab.vigencia.dataFinal
                      ? tab.vigencia.dataFinal.toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tab.status)}
                  </TableCell>
                  <TableCell>
                    {tab.servicos.length}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100" aria-label="Ações">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu de ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 z-30 bg-white border">
                        <DropdownMenuItem
                          onClick={() => abrirVisualizar(tab)}
                          className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        >
                          <Eye className="h-4 w-4" color="#0EA5E9" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => abrirEditar(tab)}
                          className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                        >
                          <Edit className="h-4 w-4" color="#0EA5E9" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExcluirTabela(tab)}
                          className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" color="#ea384c" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
