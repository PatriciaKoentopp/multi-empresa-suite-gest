import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, Plus, Send, Trash2, Bot, Loader2 } from "lucide-react";
import { useAssistenteIa } from "@/hooks/useAssistenteIa";
import { cn } from "@/lib/utils";

const SUGESTOES = [
  "Como estão as vendas deste ano comparadas ao ano passado?",
  "Quanto tenho a receber vencido e a vencer?",
  "Qual a previsão de recebimentos para os próximos 3 meses?",
  "Como faço para baixar uma conta a pagar?",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistenteIaPanel({ open, onOpenChange }: Props) {
  const {
    conversas,
    conversaId,
    mensagens,
    parcial,
    isStreaming,
    enviar,
    abrirConversa,
    novaConversa,
    excluirConversa,
  } = useAssistenteIa();
  const [texto, setTexto] = useState("");
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, parcial]);

  const submeter = (valor?: string) => {
    const conteudo = (valor ?? texto).trim();
    if (!conteudo || isStreaming) return;
    setTexto("");
    enviar(conteudo);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-blue-600" />
              Assistente de Análise
            </SheetTitle>
            <div className="flex items-center gap-1 pr-6">
              <Button variant="outline" size="sm" onClick={novaConversa}>
                <Plus className="mr-1 h-4 w-4" />
                Nova
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Conversas anteriores</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {conversas.length === 0 && (
                    <div className="px-2 py-3 text-sm text-muted-foreground">
                      Nenhuma conversa salva.
                    </div>
                  )}
                  {conversas.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      className={cn(
                        "flex items-center justify-between gap-2",
                        c.id === conversaId && "bg-accent"
                      )}
                      onSelect={(e) => {
                        e.preventDefault();
                        abrirConversa(c.id);
                      }}
                    >
                      <span className="truncate">{c.titulo}</span>
                      <Trash2
                        className="h-4 w-4 shrink-0 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          excluirConversa(c.id);
                        }}
                      />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {mensagens.length === 0 && !parcial && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pergunte sobre os dados da sua empresa (financeiro, vendas, CRM,
                  projetos e horas) ou sobre como usar o sistema.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      onClick={() => submeter(s)}
                      className="rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((m) =>
              m.papel === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                    {m.conteudo}
                  </div>
                </div>
              ) : (
                <div
                  key={m.id}
                  className="prose prose-sm max-w-none text-sm text-foreground prose-table:text-xs"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.conteudo}
                  </ReactMarkdown>
                </div>
              )
            )}

            {parcial && (
              <div className="prose prose-sm max-w-none text-sm text-foreground prose-table:text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{parcial}</ReactMarkdown>
              </div>
            )}

            {isStreaming && !parcial && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando os dados...
              </div>
            )}
            <div ref={fimRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submeter();
                }
              }}
              placeholder="Faça uma pergunta sobre os dados ou sobre o sistema..."
              className="min-h-[60px] resize-none"
              disabled={isStreaming}
            />
            <Button
              onClick={() => submeter()}
              disabled={isStreaming || !texto.trim()}
              className="h-10 bg-blue-600 hover:bg-blue-700"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            O assistente apenas consulta dados; ele não altera registros.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
