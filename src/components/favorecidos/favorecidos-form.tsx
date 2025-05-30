
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/company-context";
import { FavorecidoDadosBasicos } from "./favorecido-dados-basicos";
import { FavorecidoEndereco } from "./favorecido-endereco";
import { FavorecidoDocumento } from "./favorecido-documento";
import { FavorecidoTipoRadio } from "./favorecido-tipo-radio";
import { FavorecidoAniversarioStatus } from "./favorecido-aniversario-status";
import { GrupoFavorecidos, Profissao } from "@/types";

interface FavorecidosFormProps {
  grupos: GrupoFavorecidos[];
  profissoes: Profissao[];
  onSubmit?: () => void;
  onCancel?: () => void;
  favorecido?: any;
}

export function FavorecidosForm({ grupos, profissoes, onSubmit, onCancel, favorecido }: FavorecidosFormProps) {
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados básicos
  const [tipo, setTipo] = useState<'pf' | 'pj'>(favorecido?.tipo || 'pf');
  const [nome, setNome] = useState(favorecido?.nome || '');
  const [apelido, setApelido] = useState(favorecido?.apelido || '');
  const [email, setEmail] = useState(favorecido?.email || '');
  const [telefone, setTelefone] = useState(favorecido?.telefone || '');
  const [celular, setCelular] = useState(favorecido?.celular || '');
  const [grupoId, setGrupoId] = useState(favorecido?.grupo_id || '');
  const [profissaoId, setProfissaoId] = useState(favorecido?.profissao_id || '');
  
  // Estados de endereço
  const [logradouro, setLogradouro] = useState(favorecido?.logradouro || '');
  const [numero, setNumero] = useState(favorecido?.numero || '');
  const [complemento, setComplemento] = useState(favorecido?.complemento || '');
  const [bairro, setBairro] = useState(favorecido?.bairro || '');
  const [cidade, setCidade] = useState(favorecido?.cidade || '');
  const [uf, setUf] = useState(favorecido?.uf || '');
  const [cep, setCep] = useState(favorecido?.cep || '');
  
  // Estados de documento
  const [documento, setDocumento] = useState(favorecido?.documento || '');
  const [rgIe, setRgIe] = useState(favorecido?.rg_ie || '');
  
  // Estados de aniversário e status
  const [dataAniversario, setDataAniversario] = useState(favorecido?.data_aniversario || '');
  const [status, setStatus] = useState<'ativo' | 'inativo'>(favorecido?.status || 'ativo');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCompany?.id) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    setIsLoading(true);

    try {
      const dadosFavorecido = {
        empresa_id: currentCompany.id,
        tipo,
        nome,
        apelido,
        email,
        telefone,
        celular,
        grupo_id: grupoId || null,
        profissao_id: profissaoId || null,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        cep,
        documento,
        rg_ie: rgIe,
        data_aniversario: dataAniversario || null,
        status,
      };

      if (favorecido?.id) {
        // Atualizar favorecido existente
        const { error } = await supabase
          .from('favorecidos')
          .update(dadosFavorecido)
          .eq('id', favorecido.id);

        if (error) throw error;
        toast.success("Favorecido atualizado com sucesso!");
      } else {
        // Criar novo favorecido
        const { error } = await supabase
          .from('favorecidos')
          .insert([dadosFavorecido]);

        if (error) throw error;
        toast.success("Favorecido criado com sucesso!");
      }

      if (onSubmit) {
        onSubmit();
      }
    } catch (error: any) {
      console.error('Erro ao salvar favorecido:', error);
      toast.error("Erro ao salvar favorecido: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{favorecido ? 'Editar' : 'Novo'} Favorecido</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FavorecidoTipoRadio
            tipo={tipo}
            onTipoChange={setTipo}
          />

          <FavorecidoDadosBasicos
            nome={nome}
            onNomeChange={setNome}
            apelido={apelido}
            onApelidoChange={setApelido}
            email={email}
            onEmailChange={setEmail}
            telefone={telefone}
            onTelefoneChange={setTelefone}
            celular={celular}
            onCelularChange={setCelular}
            grupoId={grupoId}
            onGrupoChange={setGrupoId}
            profissaoId={profissaoId}
            onProfissaoChange={setProfissaoId}
            grupos={grupos}
            profissoes={profissoes}
          />

          <FavorecidoEndereco
            logradouro={logradouro}
            onLogradouroChange={setLogradouro}
            numero={numero}
            onNumeroChange={setNumero}
            complemento={complemento}
            onComplementoChange={setComplemento}
            bairro={bairro}
            onBairroChange={setBairro}
            cidade={cidade}
            onCidadeChange={setCidade}
            uf={uf}
            onUfChange={setUf}
            cep={cep}
            onCepChange={setCep}
          />

          <FavorecidoDocumento
            tipo={tipo}
            documento={documento}
            onDocumentoChange={setDocumento}
            rgIe={rgIe}
            onRgIeChange={setRgIe}
          />

          <FavorecidoAniversarioStatus
            dataAniversario={dataAniversario}
            onDataAniversarioChange={setDataAniversario}
            status={status}
            onStatusChange={setStatus}
          />

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="blue" disabled={isLoading}>
              {isLoading ? "Salvando..." : favorecido ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
