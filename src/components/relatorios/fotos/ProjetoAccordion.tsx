import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";

interface ProjetoFotosAgrupado {
  numeroProjeto: string;
  numero: string;
  nome: string;
  projetos: string[];
  cliente: string;
  totalHoras: number;
  horasFaturaveis: number;
  horasNaoFaturaveis: number;
  valorFaturavel: number;
  membros: string;
  gerente: string;
  observacao: string;
  percentualTotal: number;
  fotosVendidas: number;
  fotosEnviadas: number;
  fotosTiradas: number;
  tempoPorFotoVendida: number;
}

interface ProjetoAccordionProps {
  projetos: ProjetoFotosAgrupado[];
}

const formatHoursMinutes = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

export const ProjetoAccordion = ({ projetos }: ProjetoAccordionProps) => {
  return (
    <>
      {projetos.map((projeto) => (
        <AccordionItem key={projeto.numeroProjeto} value={projeto.numeroProjeto}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-pink-500" />
                <div className="text-left">
                  <p className="font-semibold">📊 Projeto {projeto.numeroProjeto}</p>
                  <p className="text-sm text-muted-foreground">{projeto.cliente}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatHoursMinutes(projeto.totalHoras)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {projeto.percentualTotal.toFixed(1)}% do total
                  </p>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pl-11 pt-4">
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-semibold mb-2">Projetos incluídos:</p>
                <div className="space-y-1">
                  {projeto.projetos.map((nomeCompleto, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      <span>• {nomeCompleto}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm mt-4 mb-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground text-xs">Fotos Vendidas</span>
                  <p className="text-2xl font-bold mt-1">{projeto.fotosVendidas}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground text-xs">Fotos Enviadas</span>
                  <p className="text-2xl font-bold mt-1">{projeto.fotosEnviadas}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground text-xs">Fotos Tiradas</span>
                  <p className="text-2xl font-bold mt-1">{projeto.fotosTiradas}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground text-xs">Tempo/Foto Vendida</span>
                  <p className="text-2xl font-bold mt-1">
                    {projeto.tempoPorFotoVendida > 0 
                      ? formatHoursMinutes(projeto.tempoPorFotoVendida)
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {projeto.gerente && (
                  <div>
                    <span className="text-muted-foreground">Gerente:</span>
                    <span className="ml-2 font-medium">{projeto.gerente}</span>
                  </div>
                )}
                {projeto.membros && (
                  <div>
                    <span className="text-muted-foreground">Membros:</span>
                    <span className="ml-2 font-medium">{projeto.membros}</span>
                  </div>
                )}
              </div>

              {projeto.observacao && (
                <div className="text-sm mt-4">
                  <span className="text-muted-foreground">Observação:</span>
                  <p className="mt-1 text-sm">{projeto.observacao}</p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </>
  );
};
