
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
      if (favorecido.grupo_id) {
        const { data: grupoData } = await supabase
          .from('grupo_favorecidos')
          .select('*')
          .eq('id', favorecido.grupo_id)
          .single();
          
        if (grupoData) {
          setGrupo({
            id: grupoData.id,
            nome: grupoData.nome,
            status: grupoData.status as "ativo" | "inativo",
            empresa_id: grupoData.empresa_id,
            created_at: new Date(grupoData.created_at),
            updated_at: new Date(grupoData.updated_at)
          });
        }
      }
      
      if (favorecido.profissao_id) {
        const { data: profissaoData } = await supabase
          .from('profissoes')
          .select('*')
          .eq('id', favorecido.profissao_id)
          .single();
          
        if (profissaoData) {
          setProfissao({
            id: profissaoData.id,
            nome: profissaoData.nome,
            status: profissaoData.status as "ativo" | "inativo",
            empresa_id: profissaoData.empresa_id,
            created_at: new Date(profissaoData.created_at),
            updated_at: new Date(profissaoData.updated_at)
          });
        }
      }
    };
    
    fetchRelacionamentos();
  }, [favorecido.grupo_id, favorecido.profissao_id]);

  const getTipoFavorecidoLabel = (tipo: string) => {
    switch (tipo) {
      case "fisica":
        return "Pessoa Física";
      case "juridica":
        return "Pessoa Jurídica";
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

  // Função atualizada para formatar corretamente CPF e CNPJ independente do tipo de favorecido
  const formatarDocumento = (documento: string, tipoDocumento: string): string => {
    if (!documento) return "Não informado";
    
    // Remove caracteres não numéricos
    const numeros = documento.replace(/\D/g, '');
    
    if (tipoDocumento === "cpf") {
      // Formatação para CPF: 000.000.000-00
      if (numeros.length !== 11) return documento;
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (tipoDocumento === "cnpj") {
      // Formatação para CNPJ: 00.000.000/0000-00
      if (numeros.length !== 14) return documento;
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    
    return documento;
  };
  
  // Nova função para formatar o telefone no padrão (00) 00000-0000
  const formatarTelefone = (telefone: string): string => {
    if (!telefone) return "Não informado";
    
    // Remove caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    
    if (numeros.length === 11) {
      // Celular: (00) 00000-0000
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (numeros.length === 10) {
      // Telefone fixo: (00) 0000-0000
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    
    return telefone;
  };
  
  // Nova função para formatar o CEP no padrão 00.000-000
  const formatarCep = (cep: string): string => {
    if (!cep) return "Não informado";
    
    // Remove caracteres não numéricos
    const numeros = cep.replace(/\D/g, '');
    
    if (numeros.length === 8) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})/, "$1.$2-$3");
    }
    
    return cep;
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
              {favorecido.nome_fantasia && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome Fantasia:</span>
                  <span className="font-medium">{favorecido.nome_fantasia}</span>
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
                  {favorecido.tipo_documento === 'cpf' ? 'CPF: ' : 'CNPJ: '}
                  {formatarDocumento(favorecido.documento, favorecido.tipo_documento)}
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
                  {favorecido.data_aniversario 
                    ? formatDate(favorecido.data_aniversario)
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
                <span className="font-medium">{formatarTelefone(favorecido.telefone || "")}</span>
              </div>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Endereço</h3>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CEP:</span>
                <span className="font-medium">{formatarCep(favorecido.cep || "")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logradouro:</span>
                <span className="font-medium">{favorecido.logradouro || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número:</span>
                <span className="font-medium">{favorecido.numero || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Complemento:</span>
                <span className="font-medium">{favorecido.complemento || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bairro:</span>
                <span className="font-medium">{favorecido.bairro || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cidade:</span>
                <span className="font-medium">{favorecido.cidade || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-medium">{favorecido.estado || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">País:</span>
                <span className="font-medium">{favorecido.pais || "Brasil"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
