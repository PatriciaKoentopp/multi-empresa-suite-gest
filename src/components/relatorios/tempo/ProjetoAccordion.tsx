import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ProjetoAgrupado } from "@/hooks/useRelatorioTempo";
import { FileText, User, Clock } from "lucide-react";
import { formatHoursDisplay, decimalToHHMMSS } from "@/utils/timeUtils";

interface ProjetoAccordionProps {
  projetos: ProjetoAgrupado[];
}

export const ProjetoAccordion = ({ projetos }: ProjetoAccordionProps) => {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {projetos.map((projeto, index) => (
        <AccordionItem key={index} value={`projeto-${index}`} className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">📊 Projeto {projeto.numeroProjeto}</p>
                  <p className="text-sm text-muted-foreground">{projeto.cliente}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatHoursDisplay(projeto.totalHoras)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {projeto.percentualTotal.toFixed(1)}% do total • {projeto.tarefas.length} tarefas
                  </p>
                </div>
                {projeto.valorFaturavel > 0 && (
                  <Badge variant="default">
                    R$ {projeto.valorFaturavel.toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-semibold mb-2">Projetos incluídos:</p>
              <div className="space-y-1">
                {projeto.projetos.map((nomeCompleto, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">• {nomeCompleto}</span>
                    <Badge variant="outline" className="text-xs">
                      {projeto.tarefas.filter(t => t.projetoCompleto === nomeCompleto).length} tarefas
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              {projeto.projetos.map((nomeCompleto) => {
                const tarefasProjeto = projeto.tarefas.filter(t => t.projetoCompleto === nomeCompleto);
                if (tarefasProjeto.length === 0) return null;
                
                return (
                  <div key={nomeCompleto} className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground px-2 py-1 bg-muted/50 rounded">
                      📁 {nomeCompleto}
                    </div>
                    {tarefasProjeto.map((tarefa, tIndex) => (
                      <Card key={tIndex} className="bg-background ml-4">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{tarefa.tarefa}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">{tarefa.usuario}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-sm font-medium">{tarefa.horas.toFixed(2)}h</span>
                              <p className="text-xs text-muted-foreground font-mono">{decimalToHHMMSS(tarefa.horas)}</p>
                            </div>
                            <Badge variant={tarefa.faturavel ? "default" : "secondary"} className="text-xs">
                              {tarefa.faturavel ? "Faturável" : "Não faturável"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
