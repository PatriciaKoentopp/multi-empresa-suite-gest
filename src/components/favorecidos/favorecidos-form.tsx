import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface FavorecidosFormProps {
  favorecido?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function FavorecidosForm({ favorecido, onSave, onCancel }: FavorecidosFormProps) {
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  const [nome, setNome] = useState(favorecido?.nome || "");
  const [tipo, setTipo] = useState(favorecido?.tipo || "fornecedor");
  const [cpfCnpj, setCpfCnpj] = useState(favorecido?.cpf_cnpj || "");
  const [dataAniversario, setDataAniversario] = useState(favorecido?.data_aniversario || "");
  const [email, setEmail] = useState(favorecido?.email || "");
  const [telefone, setTelefone] = useState(favorecido?.telefone || "");
  const [endereco, setEndereco] = useState(favorecido?.endereco || "");
  const [numero, setNumero] = useState(favorecido?.numero || "");
  const [complemento, setComplemento] = useState(favorecido?.complemento || "");
  const [bairro, setBairro] = useState(favorecido?.bairro || "");
  const [cidade, setCidade] = useState(favorecido?.cidade || "");
  const [estado, setEstado] = useState(favorecido?.estado || "");
  const [cep, setCep] = useState(favorecido?.cep || "");
  const [observacoes, setObservacoes] = useState(favorecido?.observacoes || "");
  const [dataAniversarioDate, setDataAniversarioDate] = useState<Date | undefined>(favorecido?.data_aniversario ? new Date(favorecido.data_aniversario) : undefined);

  useEffect(() => {
    // Atualiza o estado dataAniversarioDate quando favorecido.data_aniversario muda
    if (favorecido?.data_aniversario) {
      setDataAniversarioDate(new Date(favorecido.data_aniversario));
    } else {
      setDataAniversarioDate(undefined);
    }
  }, [favorecido?.data_aniversario]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setDataAniversario(format(date, 'yyyy-MM-dd'));
    } else {
      setDataAniversario('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !cpfCnpj) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const favorecidoData = {
      id: favorecido?.id,
      empresa_id: currentCompany?.id,
      nome,
      tipo,
      cpf_cnpj: cpfCnpj,
      data_aniversario: dataAniversario || null,
      email,
      telefone,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      observacoes,
      created_at: favorecido?.created_at || format(new Date(), 'yyyy-MM-dd'),
      updated_at: format(new Date(), 'yyyy-MM-dd')
    };

    await onSave(favorecidoData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome *</Label>
        <Input
          type="text"
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="fornecedor">Fornecedor</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="funcionario">Funcionário</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
        <Input
          type="text"
          id="cpfCnpj"
          value={cpfCnpj}
          onChange={(e) => setCpfCnpj(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="dataAniversario">Data de Aniversário</Label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            id="dataAniversario"
            value={dataAniversarioDate ? format(dataAniversarioDate, "yyyy-MM-dd") : ""}
            onChange={(e) => {
              const newDate = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined;
              setDataAniversarioDate(newDate);
              handleDateChange(newDate);
            }}
          />
          <Calendar className="text-blue-500" />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          type="tel"
          id="telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          type="text"
          id="endereco"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="numero">Número</Label>
          <Input
            type="text"
            id="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            type="text"
            id="complemento"
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="bairro">Bairro</Label>
        <Input
          type="text"
          id="bairro"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="cidade">Cidade</Label>
        <Input
          type="text"
          id="cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="estado">Estado</Label>
          <Input
            type="text"
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="cep">CEP</Label>
          <Input
            type="text"
            id="cep"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Input
          type="text"
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
