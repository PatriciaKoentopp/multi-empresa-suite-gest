
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Settings, Grid, List, DollarSign, Calculator, ShoppingBag, Users, BarChart, Save } from "lucide-react";
import { useModulosParametros } from "@/hooks/useModulosParametros";
import { navigationConfig } from "@/config/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const getIconForModule = (title: string) => {
  switch (title) {
    case "Dashboard": return <Grid className="h-5 w-5" />;
    case "Administrativo": return <Settings className="h-5 w-5" />;
    case "Cadastros": return <List className="h-5 w-5" />;
    case "Financeiro": return <DollarSign className="h-5 w-5" />;
    case "Contábil": return <Calculator className="h-5 w-5" />;
    case "Vendas": return <ShoppingBag className="h-5 w-5" />;
    case "CRM": return <Users className="h-5 w-5" />;
    case "Relatórios": return <BarChart className="h-5 w-5" />;
    default: return <Settings className="h-5 w-5" />;
  }
};

export default function Parametros() {
  const { parametros, isLoading, updateParametro, isModuloAtivo, refetch } = useModulosParametros();
  const { toast } = useToast();
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleModuloChange = async (moduloKey: string, ativo: boolean) => {
    console.log('Alterando módulo:', moduloKey, 'para:', ativo);
    setChanges(prev => ({ ...prev, [moduloKey]: ativo }));
  };

  const handleSubItemChange = async (subItemKey: string, ativo: boolean) => {
    console.log('Alterando subitem:', subItemKey, 'para:', ativo);
    setChanges(prev => ({ ...prev, [subItemKey]: ativo }));
  };

  const saveChanges = async () => {
    if (Object.keys(changes).length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Não há alterações para salvar"
      });
      return;
    }

    setIsSaving(true);
    try {
      const promises = Object.entries(changes).map(([key, value]) => 
        updateParametro(key, value)
      );
      
      await Promise.all(promises);
      
      setChanges({});
      
      toast({
        title: "Sucesso",
        description: `${Object.keys(changes).length} alterações salvas com sucesso`
      });
      
      // Aguardar um pouco antes de recarregar para garantir que as alterações foram processadas
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as alterações"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getModuloStatus = (moduloKey: string) => {
    return changes.hasOwnProperty(moduloKey) ? changes[moduloKey] : isModuloAtivo(moduloKey);
  };

  const isParametrosModule = (moduloKey: string) => {
    return moduloKey === 'admin/parametros' || moduloKey === 'parametros';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parâmetros do Sistema</h1>
          <p className="text-muted-foreground">
            Configure quais módulos e rotinas devem aparecer no menu do sistema
          </p>
        </div>
        
        <div className="grid gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parâmetros do Sistema</h1>
          <p className="text-muted-foreground">
            Configure quais módulos e rotinas devem aparecer no menu do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refetch} variant="outline">
            Recarregar
          </Button>
          <Button 
            onClick={saveChanges} 
            variant="blue"
            disabled={Object.keys(changes).length === 0 || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total de parâmetros carregados: {parametros.length}</span>
          {Object.keys(changes).length > 0 && (
            <span className="text-orange-600 font-medium">
              {Object.keys(changes).length} alteração(ões) pendente(s)
            </span>
          )}
        </div>
      </div>
      
      <div className="grid gap-6">
        {navigationConfig.map((modulo, index) => {
          const moduloKey = modulo.href ? modulo.href.replace('/', '') : modulo.title.toLowerCase().replace(/\s+/g, '-');
          const moduloAtivo = getModuloStatus(moduloKey);
          const isParametrosProtected = isParametrosModule(moduloKey);
          
          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIconForModule(modulo.title)}
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {modulo.title}
                        {isParametrosProtected && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                            Protegido
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Chave: {moduloKey} | {modulo.subItems ? `${modulo.subItems.length} rotinas disponíveis` : 'Módulo principal'}
                        {isParametrosProtected && (
                          <span className="block text-amber-600 text-xs mt-1">
                            Este módulo não pode ser desabilitado para manter o acesso às configurações
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`modulo-${moduloKey}`}
                      checked={moduloAtivo}
                      disabled={isParametrosProtected}
                      onCheckedChange={(checked) => handleModuloChange(moduloKey, checked)}
                    />
                    <Label htmlFor={`modulo-${moduloKey}`} className="text-sm font-medium">
                      {moduloAtivo ? 'Ativo' : 'Inativo'}
                    </Label>
                  </div>
                </div>
              </CardHeader>
              
              {modulo.subItems && modulo.subItems.length > 0 && (
                <CardContent>
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Rotinas do Módulo</h4>
                    <div className="grid gap-3">
                      {modulo.subItems.map((subItem, subIndex) => {
                        const subItemKey = subItem.href.replace('/', '');
                        const subItemAtivo = getModuloStatus(subItemKey);
                        const isSubParametrosProtected = isParametrosModule(subItemKey);
                        
                        return (
                          <div key={subIndex} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                            <div>
                              <Label htmlFor={`subitem-${subItemKey}`} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                {subItem.title}
                                {isSubParametrosProtected && (
                                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                    Protegido
                                  </span>
                                )}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Chave: {subItemKey} | Rota: {subItem.href}
                                {isSubParametrosProtected && (
                                  <span className="block text-amber-600 text-xs mt-1">
                                    Esta rotina não pode ser desabilitada
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`subitem-${subItemKey}`}
                                checked={subItemAtivo && moduloAtivo}
                                disabled={!moduloAtivo || isSubParametrosProtected}
                                onCheckedChange={(checked) => handleSubItemChange(subItemKey, checked)}
                              />
                              <Label htmlFor={`subitem-${subItemKey}`} className="text-xs">
                                {subItemAtivo && moduloAtivo ? 'Ativo' : 'Inativo'}
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
