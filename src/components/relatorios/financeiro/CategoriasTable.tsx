
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoriaFinanceira } from "@/hooks/useRelatorioFinanceiro";

interface CategoriasTableProps {
  categoriasDespesas: CategoriaFinanceira[];
  categoriasReceitas: CategoriaFinanceira[];
  loading?: boolean;
}

export function CategoriasTable({ categoriasDespesas, categoriasReceitas, loading }: CategoriasTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Combinar e ordenar todas as categorias
  const todasCategorias = [
    ...categoriasDespesas.map(cat => ({ ...cat, tipo: "Despesa" as const })),
    ...categoriasReceitas.map(cat => ({ ...cat, tipo: "Receita" as const })),
  ].sort((a, b) => b.total - a.total);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (todasCategorias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Nenhuma movimentação no período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Classificação DRE</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">% do Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {todasCategorias.map((cat, index) => (
              <TableRow key={`${cat.categoria_id}-${cat.tipo}-${index}`}>
                <TableCell className="font-medium">{cat.categoria_nome}</TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {cat.classificacao_dre || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={cat.tipo === "Receita" ? "default" : "destructive"}>
                    {cat.tipo}
                  </Badge>
                </TableCell>
                <TableCell className={`text-right font-medium ${cat.tipo === "Receita" ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(cat.total)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {cat.percentual.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
