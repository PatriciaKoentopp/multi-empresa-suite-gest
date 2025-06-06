import { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadFormModal } from "./lead-form-modal";
import { supabase } from "@/integrations/supabase/client";
import { EtapaFunil, Origem, Usuario, MotivoPerda } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { confirm } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { useFunil } from "@/hooks/useFunil";

interface Lead {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  valor: number;
  dataCriacao: string;
  ultimoContato: string;
  origemNome: string;
  responsavelNome: string;
  etapaNome: string;
  produto: string;
  status: string;
  produto_id: string | null;
  servico_id: string | null;
  favorecido_id: string | null;
}

export default function Leads() {
  const [modalOpen, setModalOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [etapas, setEtapas] = useState<EtapaFunil[]>([]);
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [motivosPerda, setMotivosPerda] = useState<MotivoPerda[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
	const { currentFunil: funnelId } = useFunil();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar leads
      let { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id, nome, empresa, email, telefone, valor, data_criacao, ultimo_contato, produto, status, produto_id, servico_id, favorecido_id,
          origens ( nome ),
          usuarios ( nome ),
          etapas_funil ( nome )
        `)
				.eq('funil_id', funnelId);

      if (leadsError) {
        console.error("Erro ao buscar leads:", leadsError);
        throw leadsError;
      }

      // Mapear os dados para o formato esperado
      const leadsFormatados = leadsData?.map(lead => ({
        id: lead.id,
        nome: lead.nome,
        empresa: lead.empresa,
        email: lead.email,
        telefone: lead.telefone,
        valor: lead.valor,
        dataCriacao: lead.data_criacao,
        ultimoContato: lead.ultimo_contato,
        origemNome: lead.origens?.nome || 'N/A',
        responsavelNome: lead.usuarios?.nome || 'N/A',
        etapaNome: lead.etapas_funil?.nome || 'N/A',
        produto: lead.produto || 'N/A',
        status: lead.status,
        produto_id: lead.produto_id,
        servico_id: lead.servico_id,
        favorecido_id: lead.favorecido_id,
      })) || [];
      setLeads(leadsFormatados);

      // Buscar etapas do funil
      let { data: etapasData, error: etapasError } = await supabase
        .from('etapas_funil')
        .select('*')
        .order('posicao', { ascending: true })
				.eq('funil_id', funnelId);

      if (etapasError) {
        console.error("Erro ao buscar etapas do funil:", etapasError);
        throw etapasError;
      }
      setEtapas(etapasData || []);

      // Buscar origens
      let { data: origensData, error: origensError } = await supabase
        .from('origens')
        .select('*');

      if (origensError) {
        console.error("Erro ao buscar origens:", origensError);
        throw origensError;
      }
      setOrigens(origensData || []);

      // Buscar usuários
      let { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*');

      if (usuariosError) {
        console.error("Erro ao buscar usuários:", usuariosError);
        throw usuariosError;
      }
      setUsuarios(usuariosData || []);

      // Buscar motivos de perda
      let { data: motivosPerdaData, error: motivosPerdaError } = await supabase
        .from('motivos_perda')
        .select('*');

      if (motivosPerdaError) {
        console.error("Erro ao buscar motivos de perda:", motivosPerdaError);
        throw motivosPerdaError;
      }
      setMotivosPerda(motivosPerdaData || []);

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro ao carregar os dados!",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (funnelId) {
      fetchData();
    }
  }, [funnelId, router]);

  const refetch = () => {
    fetchData();
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: "nome",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nome
            <ArrowDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "empresa",
      header: "Empresa",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "telefone",
      header: "Telefone",
    },
    {
      accessorKey: "valor",
      header: "Valor",
    },
    {
      accessorKey: "dataCriacao",
      header: "Data Criação",
    },
    {
      accessorKey: "ultimoContato",
      header: "Último Contato",
    },
    {
      accessorKey: "origemNome",
      header: "Origem",
    },
    {
      accessorKey: "responsavelNome",
      header: "Responsável",
    },
    {
      accessorKey: "etapaNome",
      header: "Etapa",
    },
    {
      accessorKey: "produto",
      header: "Produto",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const lead = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setEditingLead(lead);
                  setModalOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  const confirmed = await confirm({
                    title: "Você tem certeza?",
                    description: "Esta ação irá deletar o lead permanentemente.",
                  });

                  if (!confirmed) {
                    return;
                  }

                  try {
                    const { error } = await supabase
                      .from('leads')
                      .delete()
                      .eq('id', lead.id);

                    if (error) {
                      console.error("Erro ao deletar lead:", error);
                      toast({
                        title: "Erro ao deletar lead!",
                        description: "Por favor, tente novamente.",
                        variant: "destructive",
                      });
                      return;
                    }

                    setLeads(leads.filter((l) => l.id !== lead.id));
                    toast({
                      title: "Lead deletado!",
                      description: "O lead foi deletado com sucesso.",
                    });
                  } catch (error) {
                    console.error("Erro ao deletar lead:", error);
                    toast({
                      title: "Erro ao deletar lead!",
                      description: "Por favor, tente novamente.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Deletar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a href={`/crm/leads/${lead.id}`} target="_blank" rel="noopener noreferrer">
                  Visualizar Detalhes
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleConfirm = async (leadData: any) => {
    try {
      console.log('handleConfirm recebendo dados:', leadData);
      
      // Mapear corretamente os dados para salvar no banco
      const dadosParaSalvar = {
        nome: leadData.nome,
        empresa: leadData.empresa,
        email: leadData.email,
        telefone: leadData.telefone,
        valor: leadData.valor,
        observacoes: leadData.observacoes,
        produto: leadData.produto,
        empresa_id: leadData.empresa_id,
        funil_id: funnelId,
        etapa_id: leadData.etapa_id,
        origem_id: leadData.origem_id,
        responsavel_id: leadData.responsavel_id,
        data_criacao: leadData.data_criacao,
        ultimo_contato: leadData.ultimo_contato,
        // CAMPOS IMPORTANTES que estavam faltando
        favorecido_id: leadData.favorecido_id || null,
        produto_id: leadData.produto_id || null,
        servico_id: leadData.servico_id || null,
      };

      console.log('Dados mapeados para salvar no banco:', dadosParaSalvar);
      console.log('favorecido_id final:', dadosParaSalvar.favorecido_id);
      console.log('produto_id final:', dadosParaSalvar.produto_id);
      console.log('servico_id final:', dadosParaSalvar.servico_id);

      if (editingLead) {
        console.log('Atualizando lead existente:', editingLead.id);
        const { error } = await supabase
          .from('leads')
          .update(dadosParaSalvar)
          .eq('id', editingLead.id);

        if (error) {
          console.error('Erro ao atualizar lead:', error);
          throw error;
        }

        toast.success("Lead atualizado com sucesso!");
      } else {
        console.log('Criando novo lead');
        const { data, error } = await supabase
          .from('leads')
          .insert([dadosParaSalvar])
          .select();

        if (error) {
          console.error('Erro ao criar lead:', error);
          throw error;
        }

        console.log('Lead criado com sucesso:', data);
        toast.success("Lead criado com sucesso!");
      }

      // Recarregar leads
      refetch();
      
      // Fechar modal
      setModalOpen(false);
      setEditingLead(null);
      
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error("Erro ao salvar lead");
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button onClick={() => setModalOpen(true)}>Adicionar Lead</Button>
      </div>
      <Input
        type="search"
        placeholder="Buscar leads..."
        className="mb-4"
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <LeadFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        lead={editingLead}
        etapas={etapas}
        origens={origens}
        usuarios={usuarios}
        motivosPerda={motivosPerda}
      />
    </div>
  );
}
