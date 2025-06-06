
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProdutosTable } from '@/components/produtos/produtos-table';
import { ProdutosForm } from '@/components/produtos/produtos-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Produto } from '@/types';
import { useCompany } from '@/contexts/company-context';
import { toast } from '@/hooks/use-toast';

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const { currentCompany } = useCompany();

  const fetchProdutos = async () => {
    if (!currentCompany?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('nome');

      if (error) throw error;

      // Converter status string para aceitar qualquer string do banco
      const produtosFormatados = (data || []).map(produto => ({
        ...produto,
        status: produto.status as string
      }));

      setProdutos(produtosFormatados);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [currentCompany?.id]);

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setIsSheetOpen(true);
  };

  const handleNewProduto = () => {
    setEditingProduto(null);
    setIsSheetOpen(true);
  };

  const handleSuccess = () => {
    setIsSheetOpen(false);
    setEditingProduto(null);
    fetchProdutos();
  };

  const handleCancel = () => {
    setIsSheetOpen(false);
    setEditingProduto(null);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-gray-600">Gerencie seus produtos</p>
        </div>
        
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={handleNewProduto} variant="blue">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </SheetTitle>
            </SheetHeader>
            <ProdutosForm
              produto={editingProduto}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </SheetContent>
        </Sheet>
      </div>

      <ProdutosTable
        produtos={produtos}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefresh={fetchProdutos}
      />
    </div>
  );
}
