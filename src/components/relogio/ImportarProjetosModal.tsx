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
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
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
}

const norm = (s: string) =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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

        const codigo = String(get("Código", "Codigo", "Code") ?? "").trim();
        const nome = String(get("Nome", "Name", "Projeto") ?? "").trim();
        const clienteNome = String(get("Cliente", "Client", "Favorecido") ?? "").trim();
        const fotos_tiradas = Number(get("Fotos Tiradas", "FotosTiradas")) || 0;
        const fotos_enviadas = Number(get("Fotos Enviadas", "FotosEnviadas")) || 0;
        const fotos_vendidas = Number(get("Fotos Vendidas", "FotosVendidas")) || 0;
        const statusRaw = norm(String(get("Status") ?? "ativo"));
        const status: "ativo" | "arquivado" =
          statusRaw === "arquivado" || statusRaw === "inativo" ? "arquivado" : "ativo";

        const favorecido_id = clienteNome ? favMap.get(norm(clienteNome)) ?? null : null;

        let valid = true;
        let motivo: string | undefined;
        if (!codigo) {
          valid = false;
          motivo = "Código vazio";
        } else if (!nome) {
          valid = false;
          motivo = "Nome vazio";
        } else if (!clienteNome) {
          valid = false;
          motivo = "Cliente vazio";
        } else if (!favorecido_id) {
          valid = false;
          motivo = "Cliente não encontrado no cadastro";
        }

        return {
          codigo,
          nome,
          clienteNome,
          favorecido_id,
          fotos_tiradas,
          fotos_enviadas,
          fotos_vendidas,
          status,
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

  const handleImport = async () => {
    const items: ProjetoPayload[] = preview
      .filter((p) => p.valid && p.favorecido_id)
      .map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        favorecido_id: p.favorecido_id as string,
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
        toast.warning(`${inserted} projetos importados. ${errors} falharam (códigos duplicados?).`);
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
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Importar Projetos</DialogTitle>
          <DialogDescription>
            Planilha .xlsx/.csv com as colunas: <strong>Código</strong>, <strong>Nome</strong>,{" "}
            <strong>Cliente</strong>, <strong>Fotos Tiradas</strong>,{" "}
            <strong>Fotos Enviadas</strong>, <strong>Fotos Vendidas</strong> e (opcional){" "}
            <strong>Status</strong>. O cliente é casado por nome com o cadastro de favorecidos.
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
              <div className="flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> {validCount} válidas
                </span>
                {invalidCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" /> {invalidCount} com problema
                  </span>
                )}
              </div>

              <ScrollArea className="h-[360px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right w-[80px]">Tiradas</TableHead>
                      <TableHead className="text-right w-[80px]">Enviadas</TableHead>
                      <TableHead className="text-right w-[80px]">Vendidas</TableHead>
                      <TableHead className="w-[180px]">Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, idx) => (
                      <TableRow key={idx} className={!row.valid ? "bg-red-50" : ""}>
                        <TableCell>{row.codigo}</TableCell>
                        <TableCell>{row.nome}</TableCell>
                        <TableCell>{row.clienteNome}</TableCell>
                        <TableCell className="text-right">{row.fotos_tiradas}</TableCell>
                        <TableCell className="text-right">{row.fotos_enviadas}</TableCell>
                        <TableCell className="text-right">{row.fotos_vendidas}</TableCell>
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
