
function UsuarioForm({ usuario, readOnly, onSubmit, onCancel }: UsuarioFormProps) {
  const [form, setForm] = useState<Partial<Usuario>>({
    nome: usuario?.nome || "",
    email: usuario?.email || "",
    tipo: usuario?.tipo || "Usuário",
    status: usuario?.status || "ativo",
    vendedor: usuario?.vendedor || "nao",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVendedorChange = (value: "sim" | "nao") => {
    setForm((prev) => ({
      ...prev,
      vendedor: value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <Input
          name="nome"
          value={form.nome}
          disabled={readOnly}
          onChange={handleChange}
          required
        />
      </div>
      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          name="email"
          value={form.email}
          disabled={readOnly}
          onChange={handleChange}
          required
        />
      </div>
      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium mb-1">Tipo</label>
        <Select
          value={form.tipo}
          onValueChange={(value) => handleSelectChange("tipo", value)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Administrador">Administrador</SelectItem>
            <SelectItem value="Usuário">Usuário</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <Select
          value={form.status}
          onValueChange={(value) => handleSelectChange("status", value)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Campo Vendedor */}
      <div>
        <Label className="block text-sm font-medium mb-2">Vendedor</Label>
        <RadioGroup 
          value={form.vendedor} 
          onValueChange={(value) => handleVendedorChange(value as "sim" | "nao")}
          className="flex gap-4" 
          disabled={readOnly}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="vendedor-sim" />
            <Label htmlFor="vendedor-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="vendedor-nao" />
            <Label htmlFor="vendedor-nao">Não</Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {readOnly ? "Fechar" : "Cancelar"}
        </Button>
        {!readOnly && (
          <Button type="submit" variant="blue">
            Salvar
          </Button>
        )}
      </div>
    </form>
  );
}
