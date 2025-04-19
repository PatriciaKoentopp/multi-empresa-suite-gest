import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Edit, Trash2 } from "lucide-react";

// Mock data para simular os orçamentos
const mockFaturamentos = [
  {
    id: "1",
    tipo: "Produto",
    codigo: "1001",
    data: new Date("2024-04-01"),
    favorecido: "Maria da Silva",
    projeto: "PJT-001",
    valor: 2500.75,
  },
  {
    id: "2",
    tipo: "Serviço",
    codigo: "1002",
    data: new Date("2024-04-09"),
    favorecido: "João Souza LTDA",
    projeto: "PJT-002",
    valor: 3300,
  },
  {
    id: "3",
    tipo: "Produto",
    codigo: "1003",
    data: new Date("2024-04-12"),
    favorecido: "Acme Corp",
    projeto: "PJT-003",
    valor: 1800.55,
  },
];

// Opções exemplo para Tipo e Favorecido
const tipos = ["Orçamento", "Venda"];
const favorecidos = Array.from(new Set(mockFaturamentos.map(f => f.favorecido)));

function formatDateBR(date: Date | undefined) {
  if (!date) return "";
  const d = date;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString();
  return `${day}/${month}/${year}`;
}

export default function FaturamentoPage() {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [favorecido, setFavorecido] = useState("");
  const [dataInicial, setDataInicial] = useState<Date>();
  const [dataFinal, setDataFinal] = useState<Date>();

  const [faturamentos, setFaturamentos] = useState(mockFaturamentos);

  // Filtros aplicados
  const itemsFiltrados = faturamentos.filter(item => {
    const buscaMatch = busca
      ? (
          item.codigo.toLowerCase().includes(busca.toLowerCase()) ||
          item.favorecido.toLowerCase().includes(busca.toLowerCase()) ||
          item.projeto?.toLowerCase()?.includes(busca.toLowerCase())
        )
      : true;
    // aqui troca o filtro pelo novo tipo se estiver definido
    const tipoMatch = tipo ? item.tipo === tipo : true;
    const favMatch = favorecido ? item.favorecido === favorecido : true;
    const dataI_Match = dataInicial ? item.data >= dataInicial : true;
    const dataF_Match = dataFinal ? item.data <= dataFinal : true;

    return buscaMatch && tipoMatch && favMatch && dataI_Match && dataF_Match;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center bg-white border p-4 rounded-md mb-1">
        {/* Campo de busca com ícone ao lado, como Favoritos */}
        <div className="relative flex items-center max-w-xs">
          <Search className="absolute left-2 text-gray-400 h-4 w-4 pointer-events-none" />
          <Input
            placeholder="Buscar por código, favorecido ou projeto"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {/* TODOS OS ITENS DEVEM TER VALUE != "" */}
            {tipos.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={favorecido} onValueChange={setFavorecido}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Favorecido" />
          </SelectTrigger>
          <SelectContent>
            {favorecidos.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Data Inicial */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[135px] justify-start"
            >
              {dataInicial ? (
                formatDateBR(dataInicial)
              ) : (
                <span>Data inicial</span>
              )}
            </Button>
          </PopoverTrigger>
          {/* Aqui forçamos cor de fundo branca no PopoverContent */}
          <PopoverContent className="w-auto p-0 pointer-events-auto bg-white" align="start">
            <Calendar
              mode="single"
              selected={dataInicial}
              onSelect={setDataInicial}
              className="p-3 pointer-events-auto"
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Data Final */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[135px] justify-start"
            >
              {dataFinal ? (
                formatDateBR(dataFinal)
              ) : (
                <span>Data final</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto bg-white" align="start">
            <Calendar
              mode="single"
              selected={dataFinal}
              onSelect={setDataFinal}
              className="p-3 pointer-events-auto"
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Botão de filtro - apenas ícone */}
        <Button variant="outline" size="icon" className="ml-2" title="Filtrar">
          <Filter className="w-4 h-4" />
        </Button>

        {/* Botão de novo - apenas ícone + igual outras páginas */}
        <div className="ml-auto">
          <Button variant="blue" size="icon" title="Novo Faturamento">
            <span className="text-xl leading-none">+</span>
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Tipo</TableHead>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Favorecido</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead className="text-right">Valor (R$)</TableHead>
              <TableHead className="w-20 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum faturamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              itemsFiltrados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.tipo}</TableCell>
                  <TableCell>{item.codigo}</TableCell>
                  <TableCell>{formatDateBR(item.data)}</TableCell>
                  <TableCell>{item.favorecido}</TableCell>
                  <TableCell>{item.projeto}</TableCell>
                  <TableCell className="text-right">
                    {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="flex gap-1 justify-center">
                    <Button variant="ghost" size="icon" title="Editar">
                      <Edit className="text-[#0EA5E9]" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Excluir">
                      <Trash2 className="text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
