
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { GrupoFavorecido, Profissao, Favorecido } from "@/types";
import { formatDate } from "@/lib/utils";

interface FavorecidoCadastroTabProps {
  favorecido: Favorecido;
}

export function FavorecidoCadastroTab({ favorecido }: FavorecidoCadastroTabProps) {
  const [grupo, setGrupo] = useState<GrupoFavorecido | null>(null);
  const [profissao, setProfissao] = useState<Profissao | null>(null);
  
  useEffect(() => {
    const fetchRelacionamentos = async () => {
      if (favorecido.grupoId) {
        const { data: grupoData } = await supabase
          .from('grupo_favorecidos')
          .select('*')
          .eq('id', favorecido.grupoId)
          .single();
          
        if (grupoData) {
          setGrupo({
            id: grupoData.id,
            nome: grupoData.nome,
            status: grupoData.status,
            empresa_id: grupoData.empresa_id,
            created_at: new Date(grupoData.created_at),
            updated_at: new Date(grupoData.updated_at)
          });
        }
      }
      
      if (favorecido.profissaoId) {
        const { data: profissaoData } = await supabase
          .from('profissoes')
          .select('*')
          .eq('id', favorecido.profissaoId)
          .single();
          
        if (profissaoData) {
          setProfissao({
            id: profissaoData.id,
            nome: profissaoData.nome,
            status: profissaoData.status,
            empresa_id: profissaoData.empresa_id,
            created_at: new Date(profissaoData.created_at),
            updated_at: new Date(profissaoData.updated_at)
          });
        }
      }
    };
    
    fetchRelacionamentos();
  }, [favorecido.grupoId, favorecido.profissaoId]);

  const getTipoFavorecidoLabel = (tipo: string) => {
    switch (tipo) {
      case "cliente":
        return "Cliente";
      case "fornecedor":
        return "Fornecedor";
      case "publico":
        return "Órgão Público";
      case "funcionario":
        return "Funcionário";
      default:
        return tipo;
    }
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    switch (tipo) {
      case "cpf":
        return "CPF";
      case "cnpj":
        return "CNPJ";
      default:
        return tipo;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-1/2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{favorecido.nome}</span>
              </div>
              {favorecido.nomeFantasia && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome Fantasia:</span>
                  <span className="font-medium">{favorecido.nomeFantasia}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="outline">{getTipoFavorecidoLabel(favorecido.tipo)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={favorecido.status === 'ativo' ? 'success' : 'destructive'}>
                  {favorecido.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documento:</span>
                <span className="font-medium">
                  {getTipoDocumentoLabel(favorecido.tipoDocumento)}: {favorecido.documento}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grupo:</span>
                <span className="font-medium">{grupo?.nome || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profissão:</span>
                <span className="font-medium">{profissao?.nome || "Não informada"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aniversário:</span>
                <span className="font-medium">
                  {favorecido.dataAniversario 
                    ? formatDate(favorecido.dataAniversario)
                    : "Não informado"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:w-1/2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{favorecido.email || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{favorecido.telefone || "Não informado"}</span>
              </div>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Endereço</h3>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CEP:</span>
                <span className="font-medium">{favorecido.endereco?.cep || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logradouro:</span>
                <span className="font-medium">{favorecido.endereco?.logradouro || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número:</span>
                <span className="font-medium">{favorecido.endereco?.numero || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Complemento:</span>
                <span className="font-medium">{favorecido.endereco?.complemento || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bairro:</span>
                <span className="font-medium">{favorecido.endereco?.bairro || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cidade:</span>
                <span className="font-medium">{favorecido.endereco?.cidade || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-medium">{favorecido.endereco?.estado || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">País:</span>
                <span className="font-medium">{favorecido.endereco?.pais || "Brasil"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
