import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { useLogTransacao } from "@/hooks/useLogTransacao";

const ORIGEM = "implantacao_dre";
const DOC = "IMPLANTACAO-DRE";
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface Conta { id: string; codigo: string; descricao: string; tipo: string; }
interface Existente { fluxoId: string; movId: string; valor: number; }

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseNum = (s: string) => {
  const t = String(s ?? "").trim();
  if (!t) return 0;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return isNaN(n) ? 0 : Math.abs(n);
};
const ultimoDia = (ano: number, mes: number) => {
  const d = new Date(ano, mes, 0).getDate();
  return `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

export default function ImplantacaoSaldosPage() {
  const { currentCompany } = useCompany();
  const { registrarLog } = useLogTransacao();
  const hoje = new Date();
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [contas, setContas] = useState<Conta[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [existentes, setExistentes] = useState<Record<string, Existente>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const anoNum = Number(ano);
  const qtdMeses = anoNum === hoje.getFullYear() ? Math.max(hoje.getMonth(), 1) : anoNum < hoje.getFullYear() ? 12 : 0;
  const meses = Array.from({ length: qtdMeses }, (_, i) => i + 1);
  const anos = Array.from({ length: 4 }, (_, i) => String(hoje.getFullYear() - i));

  const carregar = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      const { data: pc, error } = await supabase
        .from("plano_contas")
        .select("id, codigo, descricao, tipo")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo")
        .eq("considerar_dre", true)
        .in("tipo", ["receita", "despesa"])
        .order("codigo", { ascending: true });
      if (error) throw error;
      setContas((pc || []) as Conta[]);

      const { data: fc, error: e2 } = await supabase
        .from("fluxo_caixa")
        .select("id, valor, data_movimentacao, movimentacao_id, movimentacoes:movimentacao_id(categoria_id)")
        .eq("empresa_id", currentCompany.id)
        .eq("origem", ORIGEM)
        .gte("data_movimentacao", `${ano}-01-01`)
        .lte("data_movimentacao", `${ano}-12-31`);
      if (e2) throw e2;
      const ex: Record<string, Existente> = {};
      const vals: Record<string, string> = {};
      (fc || []).forEach((r: any) => {
        const cat = r.movimentacoes?.categoria_id;
        if (!cat) return;
        const mes = Number(String(r.data_movimentacao).substring(5, 7));
        const k = `${cat}|${mes}`;
        const v = Math.abs(Number(r.valor));
        ex[k] = { fluxoId: r.id, movId: r.movimentacao_id, valor: v };
        vals[k] = fmt(v);
      });
      setExistentes(ex);
      setValores(vals);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar saldos de implantação");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [currentCompany?.id, ano]);

  const totalLinha = (id: string) => meses.reduce((s, m) => s + parseNum(valores[`${id}|${m}`] || ""), 0);
  const totalMes = (m: number, tipo: string) =>
    contas.filter(c => c.tipo === tipo).reduce((s, c) => s + parseNum(valores[`${c.id}|${m}`] || ""), 0);

  const baixarModelo = () => {
    const rows = contas.map(c => {
      const r: Record<string, any> = { Codigo: c.codigo, Descricao: c.descricao };
      meses.forEach(m => { r[MESES[m - 1]] = parseNum(valores[`${c.id}|${m}`] || "") || ""; });
      return r;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Saldos");
    XLSX.writeFile(wb, `implantacao-saldos-dre-${ano}.xlsx`);
  };

  const importar = async (file: File) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const porCodigo = new Map(contas.map(c => [String(c.codigo).trim(), c.id]));
      const novos = { ...valores };
      let n = 0;
      rows.forEach(r => {
        const id = porCodigo.get(String(r.Codigo ?? r.codigo ?? "").trim());
        if (!id) return;
        meses.forEach(m => {
          const v = r[MESES[m - 1]];
          if (v !== undefined && v !== "") {
            novos[`${id}|${m}`] = fmt(typeof v === "number" ? Math.abs(v) : parseNum(String(v)));
            n++;
          }
        });
      });
      setValores(novos);
      toast.success(`${n} valores importados. Confira e clique em Salvar.`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ler a planilha");
    }
  };

  const salvar = async () => {
    if (!currentCompany?.id) return;
    setSaving(true);
    try {
      const fechados = new Set<number>();
      for (const m of meses) {
        const { data } = await supabase.rpc("is_periodo_fechado", { p_empresa_id: currentCompany.id, p_data: ultimoDia(anoNum, m) });
        if (data) fechados.add(m);
      }
      let inc = 0, alt = 0, exc = 0, ignorados = 0;
      for (const c of contas) {
        const tipoOp = c.tipo === "receita" ? "receber" : "pagar";
        for (const m of meses) {
          const k = `${c.id}|${m}`;
          const v = Math.round(parseNum(valores[k] || "") * 100) / 100;
          const ex = existentes[k];
          if ((ex ? ex.valor : 0) === v) continue;
          if (fechados.has(m)) { ignorados++; continue; }
          const data = ultimoDia(anoNum, m);
          const valorFluxo = tipoOp === "pagar" ? -v : v;
          if (ex && v === 0) {
            await supabase.from("fluxo_caixa").delete().eq("id", ex.fluxoId);
            await supabase.from("movimentacoes").delete().eq("id", ex.movId);
            exc++;
          } else if (ex) {
            const { error } = await supabase.from("movimentacoes").update({ valor: v }).eq("id", ex.movId);
            if (error) throw error;
            const { error: e2 } = await supabase.from("fluxo_caixa").update({ valor: valorFluxo }).eq("id", ex.fluxoId);
            if (e2) throw e2;
            alt++;
          } else {
            const descricao = `Implantação de saldo DRE - ${c.descricao} - ${String(m).padStart(2, "0")}/${ano}`;
            const { data: mov, error } = await supabase.from("movimentacoes").insert({
              empresa_id: currentCompany.id,
              tipo_operacao: tipoOp,
              data_lancamento: data,
              data_emissao: data,
              numero_documento: DOC,
              categoria_id: c.id,
              descricao,
              valor: v,
              numero_parcelas: 1,
              considerar_dre: true,
              mes_referencia: `${String(m).padStart(2, "0")}/${ano}`,
            } as any).select("id").single();
            if (error) throw error;
            const { error: e2 } = await supabase.from("fluxo_caixa").insert({
              empresa_id: currentCompany.id,
              data_movimentacao: data,
              tipo_operacao: tipoOp,
              valor: valorFluxo,
              saldo: 0,
              descricao,
              origem: ORIGEM,
              movimentacao_id: mov.id,
              conta_corrente_id: null,
            } as any);
            if (e2) throw e2;
            inc++;
          }
        }
      }
      await registrarLog({
        acao: "implantacao_saldos_dre",
        modulo: "contabil",
        entidade: "fluxo_caixa",
        descricao: `Implantação de saldos DRE ${ano}: ${inc} incluídos, ${alt} alterados, ${exc} excluídos`,
      });
      if (ignorados) toast.warning(`${ignorados} valores não gravados por estarem em meses fechados.`);
      toast.success("Saldos de implantação salvos");
      await carregar();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar saldos de implantação");
    } finally {
      setSaving(false);
    }
  };

  const grupos = useMemo(() => [
    { tipo: "receita", titulo: "Receitas" },
    { tipo: "despesa", titulo: "Despesas" },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Implantação de Saldos DRE</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={baixarModelo} disabled={!contas.length}>
            <Download className="mr-2 h-4 w-4" />
            Baixar Modelo Excel
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!contas.length}>
            <Upload className="mr-2 h-4 w-4" />
            Importar do Excel
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = ""; }} />
          <Button variant="blue" onClick={salvar} disabled={saving || !meses.length}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="w-[140px] bg-background"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background">
                {anos.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Informe o total de cada categoria por mês. Os valores entram somente no DRE e não alteram saldos de contas nem o fluxo de caixa.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !meses.length ? (
            <p className="text-sm text-muted-foreground">Não há meses anteriores para implantar neste ano.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="sticky left-0 bg-muted px-2 py-2 text-left min-w-[260px]">Categoria</th>
                    {meses.map(m => <th key={m} className="px-2 py-2 text-right min-w-[110px]">{MESES[m - 1]}</th>)}
                    <th className="px-2 py-2 text-right min-w-[120px]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map(g => {
                    const lista = contas.filter(c => c.tipo === g.tipo);
                    if (!lista.length) return null;
                    return (
                      <React.Fragment key={g.tipo}>
                        <tr className="bg-muted/50 font-semibold">
                          <td className="sticky left-0 bg-muted px-2 py-1" colSpan={meses.length + 2}>{g.titulo}</td>
                        </tr>
                        {lista.map(c => (
                          <tr key={c.id} className="border-t">
                            <td className="sticky left-0 bg-background px-2 py-1">{c.codigo} - {c.descricao}</td>
                            {meses.map(m => {
                              const k = `${c.id}|${m}`;
                              return (
                                <td key={m} className="px-1 py-1">
                                  <Input
                                    className="h-8 text-right"
                                    value={valores[k] || ""}
                                    onChange={e => setValores(v => ({ ...v, [k]: e.target.value }))}
                                    onBlur={e => setValores(v => ({ ...v, [k]: parseNum(e.target.value) ? fmt(parseNum(e.target.value)) : "" }))}
                                  />
                                </td>
                              );
                            })}
                            <td className="px-2 py-1 text-right font-medium">{fmt(totalLinha(c.id))}</td>
                          </tr>
                        ))}
                        <tr className="border-t font-semibold">
                          <td className="sticky left-0 bg-background px-2 py-1">Total {g.titulo}</td>
                          {meses.map(m => <td key={m} className="px-2 py-1 text-right">{fmt(totalMes(m, g.tipo))}</td>)}
                          <td className="px-2 py-1 text-right">{fmt(meses.reduce((s, m) => s + totalMes(m, g.tipo), 0))}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
