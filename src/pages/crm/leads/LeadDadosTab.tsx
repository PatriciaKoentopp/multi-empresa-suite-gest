
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Origem, Usuario, EtapaFunil } from "@/types";

interface LeadDadosTabProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  etapas: EtapaFunil[];
  origensAtivas: Origem[];
  vendedoresAtivos: Usuario[];
}

export function LeadDadosTab({
  formData,
  handleChange,
  handleSelectChange,
  etapas,
  origensAtivas,
  vendedoresAtivos
}: LeadDadosTabProps) {
  return (
    <div>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Nome do contato"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa</Label>
            <Input
              id="empresa"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              placeholder="Nome da empresa"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="produto">Produto</Label>
          <Input
            id="produto"
            name="produto"
            value={formData.produto || ""}
            onChange={handleChange}
            placeholder="Nome do produto"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="Telefone"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="etapa">Etapa do Funil</Label>
            <Select
              value={String(formData.etapaId)}
              onValueChange={(value) => handleSelectChange("etapaId", value)}
            >
              <SelectTrigger id="etapa" className="bg-white">
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {etapas.map((etapa) => (
                  <SelectItem key={etapa.id} value={String(etapa.id)}>
                    {etapa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              name="valor"
              type="number"
              value={formData.valor}
              onChange={handleChange}
              placeholder="Valor"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origem">Origem</Label>
            <Select 
              value={formData.origemId}
              onValueChange={(value) => handleSelectChange("origemId", value)}
            >
              <SelectTrigger id="origem" className="bg-white">
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {origensAtivas.map((origem) => (
                  <SelectItem key={origem.id} value={origem.id}>
                    {origem.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Select
              value={formData.responsavelId}
              onValueChange={(value) => handleSelectChange("responsavelId", value)}
            >
              <SelectTrigger id="responsavel" className="bg-white">
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {vendedoresAtivos.length > 0 ? (
                  vendedoresAtivos.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      {vendedor.nome}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Nenhum vendedor disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dataCriacao">Data de Criação</Label>
            <Input
              id="dataCriacao"
              value={formData.dataCriacao}
              readOnly
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ultimoContato">Último Contato</Label>
            <Input
              id="ultimoContato"
              value={formData.ultimoContato}
              readOnly
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  )
}
