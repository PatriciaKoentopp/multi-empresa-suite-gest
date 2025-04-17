export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleNavItem {
  name: string;
  href: string;
  description: string;
  icon?: string;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  name: string;
  href: string;
  description: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Profissao {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
}
