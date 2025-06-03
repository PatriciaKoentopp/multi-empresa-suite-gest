
import React from 'react';

interface ExportCSVProps {
  filename: string;
  data: any[];
  headers: { label: string; key: string }[];
  children: React.ReactNode;
}

export function ExportCSV({ filename, data, headers, children }: ExportCSVProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('Nenhum dado disponível para exportar');
      return;
    }

    // Criar o cabeçalho CSV
    const csvHeaders = headers.map(header => header.label).join(',');
    
    // Criar as linhas de dados
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header.key] || '';
        // Escapar aspas duplas e envolver em aspas se necessário
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    // Combinar cabeçalho e dados
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div onClick={handleExport}>
      {children}
    </div>
  );
}
