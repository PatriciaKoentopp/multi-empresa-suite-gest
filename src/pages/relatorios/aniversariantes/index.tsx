import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cake, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { differenceInYears, parseISO, getMonth } from "date-fns";

interface Favorecido {
  id: string;
  nome: string;
  nome_fantasia: string | null;
  tipo: string;
  telefone: string | null;
  email: string | null;
  data_aniversario: string | null;
  status: string;
}

const meses = [
  { value: "0", label: "Janeiro" },
  { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Maio" },
  { value: "5", label: "Junho" },
  { value: "6", label: "Julho" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" },
  { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" },
  { value: "11", label: "Dezembro" },
];

export default function RelatorioAniversariantes() {
  const { currentCompany } = useCompany();
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState<string>(String(new Date().getMonth()));

  useEffect(() => {
    const fetchFavorecidos = async () => {
      if (!currentCompany?.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('favorecidos')
          .select('id, nome, nome_fantasia, tipo, telefone, email, data_aniversario, status')
          .eq('empresa_id', currentCompany.id)
          .eq('status', 'ativo')
          .not('data_aniversario', 'is', null)
          .order('nome');

        if (error) throw error;
        setFavorecidos(data || []);
      } catch (error) {
        console.error('Erro ao buscar favorecidos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorecidos();
  }, [currentCompany?.id]);

  const aniversariantes = useMemo(() => {
    const mesNum = parseInt(mesSelecionado);
    
    return favorecidos.filter(f => {
      if (!f.data_aniversario) return false;
      
      try {
        const dataAniversario = parseISO(f.data_aniversario);
        return getMonth(dataAniversario) === mesNum;
      } catch {
        return false;
      }
    }).sort((a, b) => {
      if (!a.data_aniversario || !b.data_aniversario) return 0;
      const diaA = parseInt(a.data_aniversario.split('-')[2]);
      const diaB = parseInt(b.data_aniversario.split('-')[2]);
      return diaA - diaB;
    });
  }, [favorecidos, mesSelecionado]);

  const formatarDataAniversario = (dataAniversario: string | null) => {
    if (!dataAniversario) return "-";
    try {
      const [, month, day] = dataAniversario.split('-');
      return `${day}/${month}`;
    } catch {
      return "-";
    }
  };

  const calcularIdade = (dataAniversario: string | null) => {
    if (!dataAniversario) return "-";
    try {
      const data = parseISO(dataAniversario);
      const idade = differenceInYears(new Date(), data);
      return idade > 0 ? idade : "-";
    } catch {
      return "-";
    }
  };

  const formatarTipo = (tipo: string) => {
    switch (tipo) {
      case 'cliente': return 'Cliente';
      case 'fornecedor': return 'Fornecedor';
      case 'ambos': return 'Cliente/Fornecedor';
      default: return tipo;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório de Aniversariantes</h1>
        <p className="text-muted-foreground">
          Consulta de favorecidos com aniversário no período selecionado
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <label className="text-sm font-medium mb-2 block">Mês</label>
          <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {meses.map((mes) => (
                <SelectItem key={mes.value} value={mes.value}>
                  {mes.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aniversariantes do Mês
            </CardTitle>
            <Cake className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aniversariantes.length}</div>
            <p className="text-xs text-muted-foreground">
              {meses[parseInt(mesSelecionado)]?.label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Favorecidos com Aniversário
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favorecidos.length}</div>
            <p className="text-xs text-muted-foreground">
              Com data de aniversário cadastrada
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Aniversariantes de {meses[parseInt(mesSelecionado)]?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : aniversariantes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aniversariante encontrado para o mês selecionado
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-center">Aniversário</TableHead>
                    <TableHead className="text-center">Idade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aniversariantes.map((favorecido) => (
                    <TableRow key={favorecido.id}>
                      <TableCell className="font-medium">
                        {favorecido.nome}
                        {favorecido.nome_fantasia && (
                          <span className="text-muted-foreground text-sm block">
                            {favorecido.nome_fantasia}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatarTipo(favorecido.tipo)}</TableCell>
                      <TableCell>{favorecido.telefone || "-"}</TableCell>
                      <TableCell>{favorecido.email || "-"}</TableCell>
                      <TableCell className="text-center">
                        {formatarDataAniversario(favorecido.data_aniversario)}
                      </TableCell>
                      <TableCell className="text-center">
                        {calcularIdade(favorecido.data_aniversario)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
