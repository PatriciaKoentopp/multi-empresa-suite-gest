import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProjetoCompleto } from "@/hooks/useRelatorioProjetos";
import { formatDate } from "@/lib/utils";
import { formatHoursMinutes } from "@/utils/timeUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  projetos: ProjetoCompleto[];
}

export function ProjetosTable({ projetos }: Props) {
  if (projetos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum projeto encontrado com os filtros selecionados
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Cód. Venda</TableHead>
            <TableHead>Data Venda</TableHead>
            <TableHead className="text-right">Receita</TableHead>
            <TableHead className="text-center">Fotos (V)</TableHead>
            <TableHead className="text-right">Horas</TableHead>
            <TableHead className="text-right">R$/Foto</TableHead>
            <TableHead className="text-right">R$/Hora</TableHead>
            <TableHead className="text-right">H/Foto</TableHead>
            <TableHead className="text-right">Efic. %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projetos.map(projeto => (
            <TableRow key={`${projeto.numeroProjeto}-${projeto.codigosVenda.join('-')}`}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{projeto.numeroProjeto}</span>
                  {!projeto.temVenda && (
                    <Badge variant="destructive" className="text-xs">Sem venda</Badge>
                  )}
                  {!projeto.temDadosFotos && (
                    <Badge variant="secondary" className="text-xs">Sem fotos</Badge>
                  )}
                  {projeto.temVenda && projeto.temDadosFotos && (
                    <Badge variant="default" className="text-xs bg-green-500">Completo</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{projeto.cliente || '-'}</TableCell>
              <TableCell>
                {projeto.codigosVenda.length === 0 ? (
                  '-'
                ) : projeto.codigosVenda.length === 1 ? (
                  projeto.codigosVenda[0]
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {projeto.codigosVenda[0]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            +{projeto.codigosVenda.length - 1}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          {projeto.codigosVenda.map(codigo => (
                            <div key={codigo}>{codigo}</div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </TableCell>
              <TableCell>
                {projeto.dataVenda ? formatDate(projeto.dataVenda) : '-'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {projeto.receita > 0 
                  ? projeto.receita.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })
                  : '-'}
              </TableCell>
              <TableCell className="text-center">
                <div className="text-sm font-medium">
                  {projeto.temDadosFotos && projeto.fotosVendidas > 0
                    ? projeto.fotosVendidas
                    : '-'}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {projeto.totalHoras > 0 
                  ? formatHoursMinutes(projeto.totalHoras)
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                {projeto.valorPorFoto > 0 
                  ? projeto.valorPorFoto.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                {projeto.valorPorHora > 0
                  ? projeto.valorPorHora.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                {projeto.horasPorFoto > 0
                  ? formatHoursMinutes(projeto.horasPorFoto)
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                {projeto.eficienciaFotos > 0
                  ? `${projeto.eficienciaFotos.toFixed(1)}%`
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {projetos.length > 0 && (() => {
          const totReceita = projetos.reduce((s, p) => s + p.receita, 0);
          const totFotos = projetos.reduce((s, p) => s + p.fotosVendidas, 0);
          const totHoras = projetos.reduce((s, p) => s + p.totalHoras, 0);
          const totEnviadas = projetos.reduce((s, p) => s + p.fotosEnviadas, 0);
          const rPorFoto = totFotos > 0 ? totReceita / totFotos : 0;
          const rPorHora = totHoras > 0 ? totReceita / totHoras : 0;
          const hPorFoto = totFotos > 0 ? totHoras / totFotos : 0;
          const efic = totEnviadas > 0 ? (totFotos / totEnviadas) * 100 : 0;
          const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          return (
            <TableFooter>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4}>TOTAL</TableCell>
                <TableCell className="text-right">{fmtBRL(totReceita)}</TableCell>
                <TableCell className="text-center">{totFotos}</TableCell>
                <TableCell className="text-right">{formatHoursMinutes(totHoras)}</TableCell>
                <TableCell className="text-right">{rPorFoto > 0 ? fmtBRL(rPorFoto) : '-'}</TableCell>
                <TableCell className="text-right">{rPorHora > 0 ? fmtBRL(rPorHora) : '-'}</TableCell>
                <TableCell className="text-right">{hPorFoto > 0 ? formatHoursMinutes(hPorFoto) : '-'}</TableCell>
                <TableCell className="text-right">{efic > 0 ? `${efic.toFixed(1)}%` : '-'}</TableCell>
              </TableRow>
            </TableFooter>
          );
        })()}
      </Table>
    </div>
  );
}
