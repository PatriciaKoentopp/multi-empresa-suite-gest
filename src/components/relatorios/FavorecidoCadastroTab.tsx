import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Favorecido } from '@/types';

export function FavorecidoCadastroTab() {
  const [searchParams] = useSearchParams();
  const [favorecido, setFavorecido] = useState<Favorecido | null>(null);

  useEffect(() => {
    const favorecidoId = searchParams.get('id');
    if (favorecidoId) {
      // Fetch data based on the ID
      fetch(`https://api.example.com/favorecidos/${favorecidoId}`)
        .then(response => response.json())
        .then(data => {
          // Simulate date conversion if necessary
          const favorecidoData = {
            ...data,
            data_aniversario: handleDateConversion(data.data_aniversario),
            created_at: handleDateConversion(data.created_at),
            updated_at: handleDateConversion(data.updated_at),
          };
          setFavorecido(favorecidoData);
        })
        .catch(error => console.error('Error fetching data:', error));
    }
  }, [searchParams]);

  const handleDateConversion = (date: Date | string) => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  };

  if (!favorecido) {
    return <div>Carregando informações do favorecido...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Favorecido</CardTitle>
        <CardDescription>Informações detalhadas sobre o favorecido.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Nome</h4>
          <p className="text-gray-600">{favorecido.nome}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Data de Aniversário</h4>
          <p className="text-gray-600">{favorecido.data_aniversario}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Data de Criação</h4>
          <p className="text-gray-600">{favorecido.created_at}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Data de Atualização</h4>
          <p className="text-gray-600">{favorecido.updated_at}</p>
        </div>
      </CardContent>
    </Card>
  );
}
