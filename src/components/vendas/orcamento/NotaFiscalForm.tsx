
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

interface NotaFiscalFormProps {
  dataNotaFiscal: string;
  onDataNotaFiscalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  numeroNotaFiscal: string;
  onNumeroNotaFiscalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNotaFiscalPdfChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  notaFiscalPdfUrl: string;
  isUploading: boolean;
  disabled?: boolean;
}

export function NotaFiscalForm({
  dataNotaFiscal,
  onDataNotaFiscalChange,
  numeroNotaFiscal,
  onNumeroNotaFiscalChange,
  onNotaFiscalPdfChange,
  notaFiscalPdfUrl,
  isUploading,
  disabled = false
}: NotaFiscalFormProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/3">
        <label className="block text-sm mb-1">Data Nota Fiscal</label>
        <Input
          type="date"
          value={dataNotaFiscal}
          onChange={onDataNotaFiscalChange}
          disabled={disabled}
        />
        {/* Mostrar a data formatada quando estiver em modo de visualização */}
        {disabled && dataNotaFiscal && (
          <div className="mt-1 text-sm text-gray-500">
            Data no banco: {dataNotaFiscal} (Formato: {formatDate(dataNotaFiscal)})
          </div>
        )}
      </div>
      <div className="w-full md:w-1/3">
        <label className="block text-sm mb-1">Número Nota Fiscal</label>
        <Input
          type="text"
          maxLength={30}
          value={numeroNotaFiscal}
          onChange={onNumeroNotaFiscalChange}
          placeholder="Ex: 12345"
          disabled={disabled}
        />
      </div>
      <div className="w-full md:w-1/3">
        <label className="block text-sm mb-1">Nota Fiscal (PDF)</label>
        {!disabled && (
          <Input
            type="file"
            accept="application/pdf"
            onChange={onNotaFiscalPdfChange}
            disabled={disabled || isUploading}
          />
        )}
        {isUploading && (
          <div className="mt-2 text-sm flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 mr-2 border-t-2 border-blue-500"></div>
            Fazendo upload...
          </div>
        )}
        {notaFiscalPdfUrl && (
          <Button
            variant="blue"
            type="button"
            className="mt-2"
            onClick={() => window.open(notaFiscalPdfUrl, '_blank')}
          >
            Baixar Nota Fiscal
          </Button>
        )}
      </div>
    </div>
  );
}
