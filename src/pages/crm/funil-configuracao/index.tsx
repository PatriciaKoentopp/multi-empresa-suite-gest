import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { FunilFormModal } from "./funil-form-modal";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
interface EtapaFunil {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
}
const etapasIniciais: EtapaFunil[] = [{
  id: 1,
  nome: "Prospecção",
  cor: "#0EA5E9",
  ordem: 1
}, {
  id: 2,
  nome: "Contato Inicial",
  cor: "#F59E0B",
  ordem: 2
}, {
  id: 3,
  nome: "Proposta Enviada",
  cor: "#10B981",
  ordem: 3
}, {
  id: 4,
  nome: "Negociação",
  cor: "#8B5CF6",
  ordem: 4
}, {
  id: 5,
  nome: "Fechamento",
  cor: "#F97316",
  ordem: 5
}];
export default function FunilConfiguracaoPage() {
  const [etapas, setEtapas] = React.useState<EtapaFunil[]>(etapasIniciais);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editEtapa, setEditEtapa] = React.useState<EtapaFunil | null>(null);
  function handleNovo() {
    setEditEtapa(null);
    setModalOpen(true);
  }
  function handleSalvarEtapa(nova: {
    nome: string;
    cor: string;
    ordem: number;
  }) {
    if (editEtapa) {
      setEtapas(prev => prev.map(e => e.id === editEtapa.id ? {
        ...e,
        ...nova
      } : e));
    } else {
      // Cria nova etapa com id incremental calculado
      const proxId = etapas.length > 0 ? Math.max(...etapas.map(x => x.id)) + 1 : 1;
      setEtapas(prev => [...prev, {
        id: proxId,
        ...nova
      }]);
    }
    setModalOpen(false);
  }
  function handleEditar(etapa: EtapaFunil) {
    setEditEtapa(etapa);
    setModalOpen(true);
  }
  function handleExcluir(id: number) {
    setEtapas(prev => prev.filter(e => e.id !== id));
  }
  return <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">Configuração do Funil de Vendas</h2>
          <p className="text-sm text-muted-foreground">Etapas do pipeline do CRM</p>
        </div>
        <Button variant="blue" size="sm" onClick={handleNovo}>
          <Plus className="mr-1" />
          Nova etapa
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Etapas do Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead className="w-32 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {etapas.length === 0 ? <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Nenhuma etapa cadastrada
                    </TableCell>
                  </TableRow> : etapas.sort((a, b) => a.ordem - b.ordem).map(etapa => <TableRow key={etapa.id} className="hover:bg-accent/30 transition-colors">
                      <TableCell>{etapa.nome}</TableCell>
                      <TableCell>
                        <span className="inline-block w-6 h-6 rounded-full border" style={{
                    background: etapa.cor,
                    borderColor: "#E5E7EB"
                  }}></span>
                      </TableCell>
                      <TableCell>{etapa.ordem}</TableCell>
                      <TableCell className="flex gap-2 justify-center">
                        <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-100 focus:bg-blue-100" onClick={() => handleEditar(etapa)}>
                          <Edit />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 focus:bg-red-100" onClick={() => handleExcluir(etapa.id)}>
                          <Trash2 />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>)}
              </TableBody>
              {etapas.length > 0 && <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-normal text-right text-muted-foreground text-xs">
                      Total de etapas: <span className="font-semibold text-foreground">{etapas.length}</span>
                    </TableCell>
                  </TableRow>
                </TableFooter>}
            </Table>
          </div>
        </CardContent>
      </Card>
      <FunilFormModal open={modalOpen} onClose={() => setModalOpen(false)} onConfirm={handleSalvarEtapa} etapa={editEtapa ? {
      nome: editEtapa.nome,
      cor: editEtapa.cor,
      ordem: editEtapa.ordem
    } : undefined} />
    </div>;
}