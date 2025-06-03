import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Usuario } from "@/types";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { formSchema, FormValues } from "./usuarios-form.schema";

interface UsuariosFormProps {
  usuario?: Usuario;
  onSubmit: (data: Partial<Usuario>) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function UsuariosForm({
  usuario,
  onSubmit,
  onCancel,
  readOnly = false,
}: UsuariosFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    tipo: "Usuário",
    status: "ativo",
    vendedor: "nao",
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (usuario) {
      setFormData({
        nome: usuario.nome || "",
        email: usuario.email || "",
        tipo: usuario.tipo || "Usuário",
        status: usuario.status || "ativo",
        vendedor: usuario.vendedor || "nao",
        created_at: typeof usuario.created_at === 'string' ? usuario.created_at : new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0]
      });
    }
  }, [usuario]);

  const handleSubmit = () => {
    const formattedData: Partial<Usuario> = {
      nome: formData.nome,
      email: formData.email,
      tipo: formData.tipo,
      status: formData.status,
      vendedor: formData.vendedor,
      created_at: formData.created_at,
      updated_at: formData.updated_at
    };
    
    onSubmit(formattedData);
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input 
                    id="nome" 
                    name="nome" 
                    value={formData.nome} 
                    onChange={handleChange} 
                    readOnly={readOnly} 
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    readOnly={readOnly} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => handleSelectChange("tipo", value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Usuário">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vendedor">Vendedor</Label>
                  <Select
                    value={formData.vendedor}
                    onValueChange={(value) => handleSelectChange("vendedor", value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="É vendedor?" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!readOnly ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue" onClick={handleSubmit}>
              Salvar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
