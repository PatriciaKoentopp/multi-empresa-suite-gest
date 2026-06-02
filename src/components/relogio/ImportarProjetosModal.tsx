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
import { useFavorecidos } from "@/hooks/useFavorecidos";
import type { ProjetoPayload } from "@/hooks/useProjetosRelogio";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: ProjetoPayload[]) => Promise<{ inserted: number; errors: number }>;
}

interface PreviewRow {
  codigo: string;
  nome: string;
  clienteNome: string;
  favorecido_id: string | null;
  fotos_tiradas: number;
  fotos_enviadas: number;
  fotos_vendidas: number;
  status: "ativo" | "arquivado";
  valid: boolean;
  motivo?: string;
  clienteStatus: "ok" | "nao_encontrado" | "vazio";
}

const norm = (s: string) =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Extrai número dentro de delimitadores (), [] ou {}
const extractNum = (text: string, open: string, close: string): number => {
  const re = new RegExp(`\\${open}\\s*(\\d+)\\s*\\${close}`);
  const m = text.match(re);
  return m ? Number(m[1]) : 0;
};

// Faz o parse da coluna "Projeto"
// Formato: "<codigo> - <nome> (vendidas) [enviadas] {tiradas}"
const parseProjeto = (raw: string) => {
  const text = String(raw ?? "").trim();
  if (!text) return { codigo: "", nome: "", tiradas: 0, enviadas: 0, vendidas: 0 };

  // separa código do restante pelo primeiro " - "
  const idx = text.indexOf(" - ");
  let codigo = "";
  let resto = text;
  if (idx >= 0) {
    codigo = text.slice(0, idx).trim();
    resto = text.slice(idx + 3).trim();
  } else {
    // sem separador: tenta usar tudo como nome, código vazio
    codigo = "";
    resto = text;
  }

  const vendidas = extractNum(resto, "(", ")");
  const enviadas = extractNum(resto, "[", "]");
  const tiradas = extractNum(resto, "{", "}");

  // remove grupos para extrair o nome limpo
  const nome = resto
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return { codigo, nome, tiradas, enviadas, vendidas };
};

export function ImportarProjetosModal({ open, onOpenChange, onImport }: Props) {
  const { data: favorecidos = [] } = useFavorecidos();
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
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      const favMap = new Map<string, string>();
      favorecidos.forEach((f) => favMap.set(norm(f.nome), f.id));

      const parsed: PreviewRow[] = rows.map((r) => {
        const get = (...keys: string[]) => {
          for (const k of keys) {
            const found = Object.keys(r).find((x) => norm(x) === norm(k));
            if (found && r[found] !== "" && r[found] != null) return r[found];
          }
          return "";
        };

        const projetoRaw = String(get("Projeto", "Project") ?? "").trim();
        const { codigo, nome, tiradas, enviadas, vendidas } = parseProjeto(projetoRaw);

        const clienteNome = String(get("Cliente", "Client", "Favorecido") ?? "").trim();
        const statusRaw = norm(String(get("Status") ?? "ativo"));
        const status: "ativo" | "arquivado" =
          statusRaw === "arquivado" || statusRaw === "inativo" ? "arquivado" : "ativo";

        let favorecido_id: string | null = null;
        let clienteStatus: PreviewRow["clienteStatus"] = "vazio";
        if (clienteNome) {
          const found = favMap.get(norm(clienteNome));
          if (found) {
            favorecido_id = found;
            clienteStatus = "ok";
          } else {
            clienteStatus = "nao_encontrado";
          }
        }

        let valid = true;
        let motivo: string | undefined;
        if (!codigo) {
          valid = false;
          motivo = "Código vazio";
        } else if (!nome) {
          valid = false;
          motivo = "Nome vazio";
        }

        return {
          codigo,
          nome,
          clienteNome,
          favorecido_id,
          fotos_tiradas: tiradas,
          fotos_enviadas: enviadas,
          fotos_vendidas: vendidas,
          status,
          valid,
          motivo,
          clienteStatus,
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
  const clienteFaltandoCount = preview.filter(
    (p) => p.valid && p.clienteStatus !== "ok"
  ).length;

  const handleImport = async () => {
    const items: ProjetoPayload[] = preview
      .filter((p) => p.valid)
      .map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        favorecido_id: p.favorecido_id,
        fotos_tiradas: p.fotos_tiradas,
        fotos_enviadas: p.fotos_enviadas,
        fotos_vendidas: p.fotos_vendidas,
        status: p.status,
      }));
    if (items.length === 0) {
      toast.error("Nenhuma linha válida para importar");
      return;
    }
    setImporting(true);
    try {
      const { inserted, errors } = await onImport(items);
      if (errors > 0) {
        toast.warning(`${inserted} projetos importados. ${errors} falharam (combinação código + nome já existe?).`);
      } else {
        toast.success(`${inserted} projetos importados com sucesso!`);
      }
      handleClose(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao importar projetos");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Importar Projetos</DialogTitle>
          <DialogDescription>
            Planilha .xlsx/.csv com as colunas: <strong>Projeto</strong>,{" "}
            <strong>Cliente</strong> e <strong>Status</strong>. A coluna{" "}
            <strong>Projeto</strong> deve seguir o padrão{" "}
            <code>codigo - nome (vendidas) [enviadas] {"{"}tiradas{"}"}</code>. Clientes
            não encontrados ficarão em branco para preenchimento manual.
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
                {clienteFaltandoCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-4 w-4" /> {clienteFaltandoCount} sem
                    cliente vinculado
                  </span>
                )}
              </div>

              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right w-[70px]">Tir.</TableHead>
                      <TableHead className="text-right w-[70px]">Env.</TableHead>
                      <TableHead className="text-right w-[70px]">Vend.</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[180px]">Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className={
                          !row.valid
                            ? "bg-red-50"
                            : row.clienteStatus === "nao_encontrado"
                            ? "bg-amber-50"
                            : ""
                        }
                      >
                        <TableCell>{row.codigo}</TableCell>
                        <TableCell>{row.nome}</TableCell>
                        <TableCell>
                          {row.clienteNome ? (
                            <span
                              className={
                                row.clienteStatus === "ok"
                                  ? ""
                                  : "text-amber-700"
                              }
                            >
                              {row.clienteNome}
                              {row.clienteStatus === "nao_encontrado" && (
                                <span className="ml-1 text-xs">(não encontrado)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{row.fotos_tiradas}</TableCell>
                        <TableCell className="text-right">{row.fotos_enviadas}</TableCell>
                        <TableCell className="text-right">{row.fotos_vendidas}</TableCell>
                        <TableCell>
                          <span
                            className={
                              row.status === "ativo"
                                ? "text-xs text-green-700"
                                : "text-xs text-red-600"
                            }
                          >
                            {row.status === "ativo" ? "Ativo" : "Arquivado"}
                          </span>
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
            {importing ? "Importando..." : `Importar ${validCount} projeto(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
