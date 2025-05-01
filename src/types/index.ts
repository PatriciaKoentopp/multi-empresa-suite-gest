import React from 'react';

export interface Orcamento {
  id: string;
  codigo: string;
  empresa_id: string;
  cliente_id: string;
  data_criacao: string;
  data_validade: string;
  status: string;
  tipo: string;
  forma_pagamento: string;
  observacoes: string;
  vendedor_id: string;
  favorecido_id: string;
  total: number;
  desconto: number;
  acrescimo: number;
  usuario_criacao: string;
  usuario_atualizacao: string;
  data_atualizacao: string;
  cliente?: Cliente;
  favorecido?: Favorecido;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  cpf_cnpj: string;
  rg_ie: string;
  data_nascimento: string;
}

export interface Favorecido {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  cpf_cnpj: string;
  rg_ie: string;
  data_nascimento: string;
}

export interface SubNavItem {
  name: string;
  href: string;
}

export interface ModuleNavItem {
  name: string;
  href?: string;
  icon?: React.ReactNode | string;
  subItems?: SubNavItem[];
}
