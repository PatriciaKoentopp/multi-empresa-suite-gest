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
                    {projeto.percentualTotal.toFixed(1)}% do total • {projeto.tarefasAgrupadas.length} tipos de tarefas
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
                  <div key={idx} className="text-sm text-muted-foreground">
                    <span>• {nomeCompleto}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                Tarefas Agrupadas ({projeto.tarefasAgrupadas.length} tipos)
              </h4>
              <div className="space-y-2">
                {projeto.tarefasAgrupadas.map((tarefa, idx) => (
                  <Card key={idx} className="bg-background">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{tarefa.tarefa}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {tarefa.usuarios.length} usuário(s): {tarefa.usuarios.join(", ")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-sm font-medium">{tarefa.totalHoras.toFixed(2)}h</span>
                            <p className="text-xs text-muted-foreground font-mono">{decimalToHHMMSS(tarefa.totalHoras)}</p>
                          </div>
                          <Badge variant={tarefa.faturavel ? "default" : "secondary"} className="text-xs">
                            {tarefa.faturavel ? "Faturável" : "Não faturável"}
                          </Badge>
                        </div>
                      </div>
                      
                      {tarefa.detalhes.length > 1 && (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Detalhamento:</p>
                          {tarefa.detalhes.map((detalhe, dIdx) => (
                            <div key={dIdx} className="flex items-center justify-between text-xs pl-4">
                              <span className="text-muted-foreground">
                                👤 {detalhe.usuario} • {detalhe.projetoCompleto}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                {detalhe.horas.toFixed(2)}h ({decimalToHHMMSS(detalhe.horas)})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};