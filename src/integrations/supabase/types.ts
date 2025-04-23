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
