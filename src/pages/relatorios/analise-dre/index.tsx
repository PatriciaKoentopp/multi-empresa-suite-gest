
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

// Mock data (replace with your actual data fetching)
const mockDadosContabeis = [
  { id: 1, ano: "2023", tipo: "receita", descricao: "Venda de produtos", grupo: "Vendas", considerar_dre: true, valoresMensais: { jan: 1000, fev: 1200 }, valorAno: 12000 },
  { id: 2, ano: "2023", tipo: "despesa", descricao: "Aluguel", grupo: "Custos Fixos", considerar_dre: true, valoresMensais: { jan: 500, fev: 500 }, valorAno: 6000 },
  { id: 3, ano: "2024", tipo: "receita", descricao: "Serviços prestados", grupo: "Serviços", considerar_dre: true, valoresMensais: { jan: 1500, fev: 1600 }, valorAno: 18000 },
  { id: 4, ano: "2024", tipo: "despesa", descricao: "Salários", grupo: "Custos Variáveis", considerar_dre: true, valoresMensais: { jan: 800, fev: 800 }, valorAno: 9600 },
  { id: 5, ano: "2023", tipo: "receita", descricao: "Outras receitas", grupo: "Outras", considerar_dre: false, valoresMensais: { jan: 200, fev: 250 }, valorAno: 2500 },
  { id: 6, ano: "2024", tipo: "despesa", descricao: "Marketing", grupo: "Marketing", considerar_dre: true, valoresMensais: { jan: 300, fev: 300 }, valorAno: 3600 },
];

const AnaliseDrePage = () => {
  const [dadosContabeis, setDadosContabeis] = useState(mockDadosContabeis);
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroTipoConta, setFiltroTipoConta] = useState("");
  const [filtroDre, setFiltroDre] = useState("");
  const [busca, setBusca] = useState("");
  const [dadosReceitas, setDadosReceitas] = useState([]);
  const [dadosDespesas, setDadosDespesas] = useState([]);
  const [totalReceitasMensais, setTotalReceitasMensais] = useState({});
  const [totalDespesasMensais, setTotalDespesasMensais] = useState({});
  const [resultadoLiquidoMensal, setResultadoLiquidoMensal] = useState({});
	const [mediaMovelReceitas, setMediaMovelReceitas] = useState({});
  const [mediaMovelDespesas, setMediaMovelDespesas] = useState({});
  const [anos, setAnos] = useState(null);

  useEffect(() => {
    const uniqueYears = [...new Set(mockDadosContabeis.map(item => item.ano))];
    setAnos(uniqueYears);
  }, []);

  // Calcula totais de receitas
  const calcularTotaisReceitas = useCallback((receitas) => {
    const totaisMensais = {};
    receitas.forEach(grupo => {
      Object.keys(grupo.totalMes).forEach(mes => {
        if (!totaisMensais[mes]) {
          totaisMensais[mes] = 0;
        }
        totaisMensais[mes] += grupo.totalMes[mes];
      });
    });
    setTotalReceitasMensais(totaisMensais);
  }, []);

  // Calcula totais de despesas
  const calcularTotaisDespesas = useCallback((despesas) => {
    const totaisMensais = {};
    despesas.forEach(grupo => {
      Object.keys(grupo.totalMes).forEach(mes => {
        if (!totaisMensais[mes]) {
          totaisMensais[mes] = 0;
        }
        totaisMensais[mes] += grupo.totalMes[mes];
      });
    });
    setTotalDespesasMensais(totaisMensais);
  }, []);

  const calcularResultadosLiquidos = useCallback(() => {
    const resultados = {};
    Object.keys(totalReceitasMensais).forEach(mes => {
      resultados[mes] = (totalReceitasMensais[mes] || 0) - (totalDespesasMensais[mes] || 0);
    });
    setResultadoLiquidoMensal(resultados);
  }, [totalReceitasMensais, totalDespesasMensais]);

  const calcularMediaMovel = useCallback(() => {
		const meses = Object.keys(totalReceitasMensais);
		const numMeses = meses.length;

		if (numMeses < 3) {
			// Não há dados suficientes para calcular a média móvel
			return;
		}

		const receitasMedias = {};
		const despesasMedias = {};

		for (let i = 2; i < numMeses; i++) {
			const mesAtual = meses[i];
			const mesAnterior1 = meses[i - 1];
			const mesAnterior2 = meses[i - 2];

			// Calcula a média móvel para receitas
			receitasMedias[mesAtual] = (
				(totalReceitasMensais[mesAtual] || 0) +
				(totalReceitasMensais[mesAnterior1] || 0) +
				(totalReceitasMensais[mesAnterior2] || 0)
			) / 3;

			// Calcula a média móvel para despesas
			despesasMedias[mesAtual] = (
				(totalDespesasMensais[mesAtual] || 0) +
				(totalDespesasMensais[mesAnterior1] || 0) +
				(totalDespesasMensais[mesAnterior2] || 0)
			) / 3;
		}

		setMediaMovelReceitas(receitasMedias);
    setMediaMovelDespesas(despesasMedias);
	}, [totalReceitasMensais, totalDespesasMensais]);

  // Função para agrupar contas por grupo
  const agruparPorGrupo = (data) => {
    const grupos = {};
    
    if (!data || data.length === 0) return [];
    
    // Agrupar por grupo/subgrupo
    data.forEach(conta => {
      const grupo = conta.grupo || 'Sem Grupo';
      if (!grupos[grupo]) {
        grupos[grupo] = {
          grupo: grupo,
          contas: [],
          totalMes: {},
          totalAno: 0
        };
      }
      
      grupos[grupo].contas.push(conta);
      
      // Somar valores mensais do grupo
      Object.keys(conta.valoresMensais || {}).forEach(mes => {
        if (!grupos[grupo].totalMes[mes]) {
          grupos[grupo].totalMes[mes] = 0;
        }
        grupos[grupo].totalMes[mes] += parseFloat(conta.valoresMensais[mes] || 0);
      });
      
      // Somar valor anual do grupo
      grupos[grupo].totalAno += parseFloat(conta.valorAno || 0);
    });
    
    // Converter objeto em array
    return Object.values(grupos);
  };

  // Função para filtrar os dados (chamará quando filtrar ou quando os dados iniciais mudarem)
  const filtrarDados = useCallback(() => {
    if (!dadosContabeis) return;

    // Aplicar filtros
    const dadosFiltrados = dadosContabeis.filter(conta => {
      // Filtro por ano
      if (filtroAno && conta.ano !== filtroAno) return false;

      // Filtro por tipo
      if (filtroTipoConta && conta.tipo !== filtroTipoConta) return false;

      // Filtro por DRE
      if (filtroDre === "sim" && !conta.considerar_dre) return false;
      if (filtroDre === "nao" && conta.considerar_dre) return false;

      // Filtro por texto
      if (busca && !conta.descricao.toLowerCase().includes(busca.toLowerCase())) return false;

      return true;
    });

    // Agrupar dados por categoria para exibição
    const receitas = dadosFiltrados.filter(conta => conta.tipo === "receita");
    const despesas = dadosFiltrados.filter(conta => conta.tipo === "despesa");
    const receitasAgrupadas = agruparPorGrupo(receitas);
    const despesasAgrupadas = agruparPorGrupo(despesas);

    setDadosReceitas(receitasAgrupadas);
    setDadosDespesas(despesasAgrupadas);

    // Calcular totais mensais e anuais
    calcularTotaisReceitas(receitasAgrupadas);
    calcularTotaisDespesas(despesasAgrupadas);
    calcularResultadosLiquidos();

    // Calcular média móvel
    calcularMediaMovel();
  }, [
    dadosContabeis, 
    filtroAno, 
    filtroTipoConta, 
    filtroDre, 
    busca,
    calcularTotaisReceitas,
    calcularTotaisDespesas,
    calcularResultadosLiquidos,
    calcularMediaMovel
  ]);

  useEffect(() => {
    filtrarDados();
  }, [dadosContabeis, filtroAno, filtroTipoConta, filtroDre, busca, filtrarDados]);

  const resetarFiltros = () => {
    setFiltroAno("");
    setFiltroTipoConta("");
    setFiltroDre("");
    setBusca("");
  };

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Análise do DRE</h2>
        <p className="text-muted-foreground">
          Analise o Demonstrativo de Resultados do Exercício
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtro Ano</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={filtroAno}
              onValueChange={setFiltroAno}
            >
              <SelectTrigger id="year">
                <SelectValue placeholder="Selecione o Ano" />
              </SelectTrigger>
              <SelectContent position="popper">
                {anos?.map(ano => (
                  <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtro Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={filtroTipoConta}
              onValueChange={setFiltroTipoConta}
            >
              <SelectTrigger id="contaType">
                <SelectValue placeholder="Tipo de Conta" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="">Todos</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtro DRE</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={filtroDre}
              onValueChange={setFiltroDre}
            >
              <SelectTrigger id="dreInclude">
                <SelectValue placeholder="Considerar no DRE" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
                <SelectItem value="">Todos</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por descrição"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button 
                variant="blue" 
                onClick={() => filtrarDados()}
                className="flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={resetarFiltros}>
          Resetar Filtros
        </Button>
        {/* Botão para exportar vai aqui */}
      </div>

      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultado Líquido Mensal</CardTitle>
              <CardDescription>Variação mês a mês do resultado líquido.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Mês</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(resultadoLiquidoMensal).map(([mes, valor]) => (
                    <TableRow key={mes}>
                      <TableCell className="font-medium">{mes}</TableCell>
                      <TableCell>{valor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
					<Card>
						<CardHeader>
							<CardTitle>Média Móvel 3 meses</CardTitle>
							<CardDescription>Média móvel de receitas e despesas dos últimos 3 meses.</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[100px]">Mês</TableHead>
										<TableHead>Receitas</TableHead>
										<TableHead>Despesas</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{Object.entries(mediaMovelReceitas).map(([mes, receitaMedia]) => {
										const despesaMedia = mediaMovelDespesas[mes] || 0; // Busca a média móvel de despesas correspondente
										return (
											<TableRow key={mes}>
												<TableCell className="font-medium">{mes}</TableCell>
												<TableCell>{receitaMedia.toFixed(2)}</TableCell>
												<TableCell>{despesaMedia.toFixed(2)}</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
        </TabsContent>
        <TabsContent value="receitas" className="space-y-4">
          {dadosReceitas.map(grupo => (
            <Card key={grupo.grupo}>
              <CardHeader>
                <CardTitle>{grupo.grupo}</CardTitle>
                <CardDescription>Total anual: {grupo.totalAno}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Conta</TableHead>
                      <TableHead>Janeiro</TableHead>
                      <TableHead>Fevereiro</TableHead>
                      {/* Adicione mais meses conforme necessário */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupo.contas.map(conta => (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium">{conta.descricao}</TableCell>
                        <TableCell>{conta.valoresMensais?.jan || 0}</TableCell>
                        <TableCell>{conta.valoresMensais?.fev || 0}</TableCell>
                        {/* Adicione mais meses conforme necessário */}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell>{grupo.totalMes?.jan || 0}</TableCell>
                      <TableCell>{grupo.totalMes?.fev || 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="despesas" className="space-y-4">
          {dadosDespesas.map(grupo => (
            <Card key={grupo.grupo}>
              <CardHeader>
                <CardTitle>{grupo.grupo}</CardTitle>
                <CardDescription>Total anual: {grupo.totalAno}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Conta</TableHead>
                      <TableHead>Janeiro</TableHead>
                      <TableHead>Fevereiro</TableHead>
                      {/* Adicione mais meses conforme necessário */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupo.contas.map(conta => (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium">{conta.descricao}</TableCell>
                        <TableCell>{conta.valoresMensais?.jan || 0}</TableCell>
                        <TableCell>{conta.valoresMensais?.fev || 0}</TableCell>
                        {/* Adicione mais meses conforme necessário */}
                      </TableRow>
                    ))}
                     <TableRow>
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell>{grupo.totalMes?.jan || 0}</TableCell>
                      <TableCell>{grupo.totalMes?.fev || 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnaliseDrePage;
