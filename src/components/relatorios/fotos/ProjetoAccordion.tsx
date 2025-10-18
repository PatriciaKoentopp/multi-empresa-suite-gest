import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";

interface TarefaFotosAgrupada {
  nome: string;
  totalHoras: number;
  percentual: number;
}

interface ProjetoFotosAgrupado {
  numeroProjeto: string;
  numero: string;
  nome: string;
  projetos: string[];
  cliente: string;
  status: string;
  visibilidade: string;
  totalHoras: number;
  horasEstimadas: number;
  horasRemanescentes: number;
  horasExcesso: number;
  progresso: number;
  horasFaturaveis: number;
  horasNaoFaturaveis: number;
  valorFaturavel: number;
  membros: string;
  gerente: string;
  observacao: string;
  tarefas: TarefaFotosAgrupada[];
  percentualTotal: number;
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
                    {projeto.percentualTotal.toFixed(1)}% do total • {projeto.tarefas.length} tarefas
                  </p>
                </div>
                <Badge variant={projeto.status === "Ativo" ? "default" : "secondary"}>
                  {projeto.status}
                </Badge>
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

              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 font-medium">{projeto.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Visibilidade:</span>
                  <span className="ml-2 font-medium">{projeto.visibilidade}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Horas Estimadas:</span>
                  <span className="ml-2 font-medium">{formatHoursMinutes(projeto.horasEstimadas)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Progresso:</span>
                  <span className="ml-2 font-medium">{projeto.progresso.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Horas Remanescentes:</span>
                  <span className="ml-2 font-medium">{formatHoursMinutes(projeto.horasRemanescentes)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Horas Excesso:</span>
                  <span className="ml-2 font-medium">{formatHoursMinutes(projeto.horasExcesso)}</span>
                </div>
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
                <div className="text-sm">
                  <span className="text-muted-foreground">Observação:</span>
                  <p className="mt-1 text-sm">{projeto.observacao}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Tarefas:</h4>
                <div className="space-y-2">
                  {projeto.tarefas.map((tarefa, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tarefa.nome}</p>
                          <Badge variant="outline" className="text-xs">
                            {tarefa.percentual.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{formatHoursMinutes(tarefa.totalHoras)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </>
  );
};
