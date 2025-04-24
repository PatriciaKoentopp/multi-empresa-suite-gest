export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contas_correntes: {
        Row: {
          agencia: string
          banco: string
          conta_contabil_id: string
          created_at: string
          data: string | null
          empresa_id: string
          id: string
          nome: string
          numero: string
          saldo_inicial: number | null
          status: string
          updated_at: string
        }
        Insert: {
          agencia: string
          banco: string
          conta_contabil_id: string
          created_at?: string
          data?: string | null
          empresa_id: string
          id?: string
          nome: string
          numero: string
          saldo_inicial?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          agencia?: string
          banco?: string
          conta_contabil_id?: string
          created_at?: string
          data?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          numero?: string
          saldo_inicial?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_correntes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          bairro: string
          cep: string
          cidade: string
          cnae: string | null
          cnpj: string
          complemento: string | null
          created_at: string | null
          email: string | null
          estado: string
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          logo: string | null
          logradouro: string
          nome_fantasia: string
          numero: string
          pais: string
          razao_social: string
          regime_tributacao: string | null
          site: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          bairro: string
          cep: string
          cidade: string
          cnae?: string | null
          cnpj: string
          complemento?: string | null
          created_at?: string | null
          email?: string | null
          estado: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo?: string | null
          logradouro: string
          nome_fantasia: string
          numero: string
          pais?: string
          razao_social: string
          regime_tributacao?: string | null
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string
          cep?: string
          cidade?: string
          cnae?: string | null
          cnpj?: string
          complemento?: string | null
          created_at?: string | null
          email?: string | null
          estado?: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo?: string | null
          logradouro?: string
          nome_fantasia?: string
          numero?: string
          pais?: string
          razao_social?: string
          regime_tributacao?: string | null
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      favorecidos: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          data_aniversario: string | null
          documento: string
          email: string | null
          empresa_id: string
          estado: string | null
          grupo_id: string | null
          id: string
          logradouro: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          pais: string | null
          profissao_id: string | null
          status: string
          telefone: string | null
          tipo: string
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          data_aniversario?: string | null
          documento: string
          email?: string | null
          empresa_id: string
          estado?: string | null
          grupo_id?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          pais?: string | null
          profissao_id?: string | null
          status?: string
          telefone?: string | null
          tipo: string
          tipo_documento: string
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          data_aniversario?: string | null
          documento?: string
          email?: string | null
          empresa_id?: string
          estado?: string | null
          grupo_id?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          pais?: string | null
          profissao_id?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          tipo_documento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorecidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorecidos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupo_favorecidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorecidos_profissao_id_fkey"
            columns: ["profissao_id"]
            isOneToOne: false
            referencedRelation: "profissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      grupo_favorecidos: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_favorecidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_perda: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "motivos_perda_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          codigo: string
          codigo_projeto: string | null
          created_at: string
          data: string
          data_nota_fiscal: string | null
          empresa_id: string
          favorecido_id: string
          forma_pagamento: string
          id: string
          nota_fiscal_pdf: string | null
          numero_nota_fiscal: string | null
          numero_parcelas: number
          observacoes: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          codigo: string
          codigo_projeto?: string | null
          created_at?: string
          data?: string
          data_nota_fiscal?: string | null
          empresa_id: string
          favorecido_id: string
          forma_pagamento: string
          id?: string
          nota_fiscal_pdf?: string | null
          numero_nota_fiscal?: string | null
          numero_parcelas?: number
          observacoes?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          codigo_projeto?: string | null
          created_at?: string
          data?: string
          data_nota_fiscal?: string | null
          empresa_id?: string
          favorecido_id?: string
          forma_pagamento?: string
          id?: string
          nota_fiscal_pdf?: string | null
          numero_nota_fiscal?: string | null
          numero_parcelas?: number
          observacoes?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_favorecido_id_fkey"
            columns: ["favorecido_id"]
            isOneToOne: false
            referencedRelation: "favorecidos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos_itens: {
        Row: {
          created_at: string
          id: string
          orcamento_id: string
          servico_id: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          orcamento_id: string
          servico_id: string
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          orcamento_id?: string
          servico_id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos_parcelas: {
        Row: {
          created_at: string
          data_vencimento: string
          id: string
          numero_parcela: string
          orcamento_id: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_vencimento: string
          id?: string
          numero_parcela: string
          orcamento_id: string
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data_vencimento?: string
          id?: string
          numero_parcela?: string
          orcamento_id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_parcelas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      origens: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "origens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas: {
        Row: {
          codigo: string
          considerar_dre: boolean
          created_at: string
          descricao: string
          empresa_id: string
          id: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          codigo: string
          considerar_dre?: boolean
          created_at?: string
          descricao: string
          empresa_id: string
          id?: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          considerar_dre?: boolean
          created_at?: string
          descricao?: string
          empresa_id?: string
          id?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profissoes: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tabelas_precos: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          nome: string
          status: string
          updated_at: string
          vigencia_final: string | null
          vigencia_inicial: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
          vigencia_final?: string | null
          vigencia_inicial?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
          vigencia_final?: string | null
          vigencia_inicial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tabelas_precos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tabelas_precos_itens: {
        Row: {
          created_at: string
          id: string
          preco: number
          servico_id: string
          tabela_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          preco: number
          servico_id: string
          tabela_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          preco?: number
          servico_id?: string
          tabela_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabelas_precos_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabelas_precos_itens_tabela_id_fkey"
            columns: ["tabela_id"]
            isOneToOne: false
            referencedRelation: "tabelas_precos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          empresa_id: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["usuario_status"]
          tipo: Database["public"]["Enums"]["usuario_tipo"]
          updated_at: string
          vendedor: Database["public"]["Enums"]["usuario_vendedor"]
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id?: string | null
          id: string
          nome: string
          status?: Database["public"]["Enums"]["usuario_status"]
          tipo?: Database["public"]["Enums"]["usuario_tipo"]
          updated_at?: string
          vendedor?: Database["public"]["Enums"]["usuario_vendedor"]
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["usuario_status"]
          tipo?: Database["public"]["Enums"]["usuario_tipo"]
          updated_at?: string
          vendedor?: Database["public"]["Enums"]["usuario_vendedor"]
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      usuario_status: "ativo" | "inativo"
      usuario_tipo: "Administrador" | "Usuário"
      usuario_vendedor: "sim" | "nao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      usuario_status: ["ativo", "inativo"],
      usuario_tipo: ["Administrador", "Usuário"],
      usuario_vendedor: ["sim", "nao"],
    },
  },
} as const
