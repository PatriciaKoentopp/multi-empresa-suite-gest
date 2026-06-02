import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { RelogioProjeto, RelogioTarefa } from "@/types/relogio";
import {
  ApontamentoPayload,
  calcularDuracaoDecimal,
} from "@/hooks/useApontamentosRelogio";
import { formatDate } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetos: RelogioProjeto[];
  tarefas: RelogioTarefa[];
  onImport: (items: ApontamentoPayload[]) => Promise<{ inserted: number; errors: number }>;
}

interface PreviewRow {
  projetoRaw: string;
  tarefaRaw: string;
  codigo: string;
  projeto_id: string | null;
  projetoNome: string;
  tarefa_id: string | null;
  tarefaNome: string;
  tarefaStatus: "ok" | "nao_encontrada" | "vazia";
  data: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS
  hora_fim: string; // HH:MM:SS
  duracao_decimal: number;
  valid: boolean;
  motivo?: string;
}

const norm = (s: string) =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const pad = (n: number) => String(n).padStart(2, "0");

const ALIAS_TAREFA: Record<string, string> = {
  [norm("Sessão de Fotos")]: norm("Sessão"),
  [norm("Produção de Fotos")]: norm("Produção"),
};

// Parser do "Projeto" (mesmo padrão da importação de projetos)
const parseCodigo = (raw: string): { codigo: string; nome: string } => {
  const text = String(raw ?? "").trim();
  if (!text) return { codigo: "", nome: "" };
  const idx = text.indexOf(" - ");
  if (idx < 0) return { codigo: "", nome: text };
  const codigo = text.slice(0, idx).trim();
  const resto = text.slice(idx + 3).trim();
  const nome = resto
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { codigo, nome };
};

// Converte célula de data para YYYY-MM-DD sem timezone
const parseDateCell = (v: unknown): string => {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    // XLSX com cellDates retorna data como UTC midnight
    return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
  }
  const s = String(v).trim();
  // DD/MM/YYYY
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return `${br[3]}-${pad(Number(br[2]))}-${pad(Number(br[1]))}`;
  // YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;
  return "";
};

// Converte célula de hora para HH:MM:SS
const parseTimeCell = (v: unknown): string => {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    return `${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}:${pad(v.getUTCSeconds())}`;
  }
  if (typeof v === "number") {
    // fração do dia
    const total = Math.round(v * 86400);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (!m) return "";
  return `${pad(Number(m[1]))}:${pad(Number(m[2]))}:${pad(Number(m[3] ?? 0))}`;
};

export function ImportarApontamentosModal({
  open,
  onOpenChange,
  projetos,
  tarefas,
  onImport,
}: Props) {
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const reset = () => {
    setPreview([]);
    setFileName("");
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: "",
      });

      // Mapas de resolução
      const projByCodigo = new Map<string, RelogioProjeto>();
      projetos.forEach((p) => projByCodigo.set(norm(p.codigo), p));

      const tarefasByTipo = new Map<string, RelogioTarefa[]>();
      tarefas.forEach((t) => {
        const arr = tarefasByTipo.get(t.tipo_projeto_id) ?? [];
        arr.push(t);
        tarefasByTipo.set(t.tipo_projeto_id, arr);
      });

      const parsed: PreviewRow[] = rows.map((r) => {
        const get = (...keys: string[]) => {
          for (const k of keys) {
            const found = Object.keys(r).find((x) => norm(x) === norm(k));
            if (found && r[found] !== "" && r[found] != null) return r[found];
          }
          return "";
        };

        const projetoRaw = String(get("Projeto", "Project") ?? "").trim();
        const tarefaRaw = String(get("Tarefa", "Task") ?? "").trim();
        const dataRaw = get("Data de início", "Data de inicio", "Data inicial", "Data");
        const horaIniRaw = get("Hora de início", "Hora de inicio", "Hora inicial");
        const horaFimRaw = get("Hora de término", "Hora de termino", "Hora final");

        const { codigo, nome: nomeParsed } = parseCodigo(projetoRaw);

        let projeto_id: string | null = null;
        let projetoNome = nomeParsed || projetoRaw;
        const proj = codigo ? projByCodigo.get(norm(codigo)) : null;
        if (proj) {
          projeto_id = proj.id;
          projetoNome = proj.nome;
        }

        // Tarefa
        let tarefa_id: string | null = null;
        let tarefaStatus: PreviewRow["tarefaStatus"] = "vazia";
        if (tarefaRaw) {
          let alvo = norm(tarefaRaw);
          if (ALIAS_TAREFA[alvo]) alvo = ALIAS_TAREFA[alvo];
          tarefaStatus = "nao_encontrada";
          if (proj?.tipo_projeto_id) {
            const cand = (tarefasByTipo.get(proj.tipo_projeto_id) ?? []).find(
              (t) => norm(t.nome) === alvo
            );
            if (cand) {
              tarefa_id = cand.id;
              tarefaStatus = "ok";
            }
          }
        }

        const data = parseDateCell(dataRaw);
        const hora_inicio = parseTimeCell(horaIniRaw);
        const hora_fim = parseTimeCell(horaFimRaw);
        const duracao_decimal = calcularDuracaoDecimal(hora_inicio, hora_fim);

        let valid = true;
        let motivo: string | undefined;
        if (!projetoRaw) {
          valid = false;
          motivo = "Projeto vazio";
        } else if (!proj) {
          valid = false;
          motivo = `Projeto ${codigo || ""} não cadastrado`;
        } else if (!data) {
          valid = false;
          motivo = "Data inválida";
        } else if (!hora_inicio || !hora_fim) {
          valid = false;
          motivo = "Horas inválidas";
        } else if (duracao_decimal <= 0) {
          valid = false;
          motivo = "Duração inválida";
        }

        return {
          projetoRaw,
          tarefaRaw,
          codigo,
          projeto_id,
          projetoNome,
          tarefa_id,
          tarefaNome: tarefaRaw,
          tarefaStatus,
          data,
          hora_inicio,
          hora_fim,
          duracao_decimal,
          valid,
          motivo,
        };
      });

      setPreview(parsed);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ler a planilha");
    }
  };

  const validCount = preview.filter((p) => p.valid).length;
  const invalidCount = preview.length - validCount;
  const tarefaFaltandoCount = preview.filter(
    (p) => p.valid && p.tarefaStatus === "nao_encontrada"
  ).length;

  const handleImport = async () => {
    const items: ApontamentoPayload[] = preview
      .filter((p) => p.valid && p.projeto_id)
      .map((p) => ({
        projeto_id: p.projeto_id as string,
        tarefa_id: p.tarefa_id,
        data: p.data,
        hora_inicio: p.hora_inicio,
        hora_fim: p.hora_fim,
        duracao_decimal: p.duracao_decimal,
        origem: "manual",
        status: "concluido",
      }));
    if (items.length === 0) {
      toast.error("Nenhuma linha válida para importar");
      return;
    }
    setImporting(true);
    try {
      const { inserted, errors } = await onImport(items);
      if (errors > 0) {
        toast.warning(`${inserted} apontamentos importados. ${errors} falharam.`);
      } else {
        toast.success(`${inserted} apontamentos importados com sucesso!`);
      }
      handleClose(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao importar apontamentos");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1100px]">
        <DialogHeader>
          <DialogTitle>Importar Apontamentos</DialogTitle>
          <DialogDescription>
            Planilha .xlsx/.csv com as colunas: <strong>Projeto</strong>,{" "}
            <strong>Tarefa</strong>, <strong>Data de início</strong>,{" "}
            <strong>Hora de início</strong> e <strong>Hora de término</strong>. O
            projeto é identificado pelo <strong>código</strong> (parte antes do " -
            "). "Sessão de Fotos" é tratada como <em>Sessão</em> e "Produção de
            Fotos" como <em>Produção</em>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="arquivo">Arquivo</Label>
            <Input
              id="arquivo"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
            />
            {fileName && (
              <p className="text-xs text-muted-foreground">Arquivo: {fileName}</p>
            )}
          </div>

          {preview.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> {validCount} válidas
                </span>
                {invalidCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" /> {invalidCount} com problema
                  </span>
                )}
                {tarefaFaltandoCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-4 w-4" /> {tarefaFaltandoCount} sem
                    tarefa vinculada
                  </span>
                )}
              </div>

              <ScrollArea className="h-[420px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Data</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead className="w-[160px]">Tarefa</TableHead>
                      <TableHead className="w-[80px]">Início</TableHead>
                      <TableHead className="w-[80px]">Fim</TableHead>
                      <TableHead className="w-[80px] text-right">Horas</TableHead>
                      <TableHead className="w-[200px]">Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className={
                          !row.valid
                            ? "bg-red-50"
                            : row.tarefaStatus === "nao_encontrada"
                            ? "bg-amber-50"
                            : ""
                        }
                      >
                        <TableCell>
                          {row.data ? formatDate(row.data) : "—"}
                        </TableCell>
                        <TableCell>
                          {row.codigo ? `${row.codigo} - ${row.projetoNome}` : row.projetoRaw}
                        </TableCell>
                        <TableCell>
                          {row.tarefaRaw ? (
                            <span
                              className={
                                row.tarefaStatus === "ok"
                                  ? ""
                                  : "text-amber-700"
                              }
                            >
                              {row.tarefaRaw}
                              {row.tarefaStatus === "nao_encontrada" && (
                                <span className="ml-1 text-xs">(não encontrada)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{row.hora_inicio?.slice(0, 5) || "—"}</TableCell>
                        <TableCell>{row.hora_fim?.slice(0, 5) || "—"}</TableCell>
                        <TableCell className="text-right font-mono">
                          {row.duracao_decimal.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {row.valid ? (
                            <span className="text-xs text-green-700">OK</span>
                          ) : (
                            <span className="text-xs text-red-600">{row.motivo}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            variant="blue"
            onClick={handleImport}
            disabled={importing || validCount === 0}
          >
            <Upload className="mr-2 h-4 w-4" />
            {importing ? "Importando..." : `Importar ${validCount} apontamento(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
