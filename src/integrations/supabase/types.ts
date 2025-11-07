export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      antecipacoes: {
        Row: {
          conta_corrente_id: string | null
          created_at: string
          data_emissao: string
          data_lancamento: string
          descricao: string | null
          empresa_id: string
          favorecido_id: string | null
          forma_pagamento: string
          id: string
          mes_referencia: string | null
          numero_documento: string | null
          status: string
          tipo_operacao: string
          tipo_titulo_id: string | null
          updated_at: string
          valor_disponivel: number | null
          valor_total: number
          valor_utilizado: number
        }
        Insert: {
          conta_corrente_id?: string | null
          created_at?: string
          data_emissao: string
          data_lancamento: string
          descricao?: string | null
          empresa_id: string
          favorecido_id?: string | null
          forma_pagamento: string
          id?: string
          mes_referencia?: string | null
          numero_documento?: string | null
          status?: string
          tipo_operacao: string
          tipo_titulo_id?: string | null
          updated_at?: string
          valor_disponivel?: number | null
          valor_total?: number
          valor_utilizado?: number
        }
        Update: {
          conta_corrente_id?: string | null
          created_at?: string
          data_emissao?: string
          data_lancamento?: string
          descricao?: string | null
          empresa_id?: string
          favorecido_id?: string | null
          forma_pagamento?: string
          id?: string
          mes_referencia?: string | null
          numero_documento?: string | null
          status?: string
          tipo_operacao?: string
          tipo_titulo_id?: string | null
          updated_at?: string
          valor_disponivel?: number | null
          valor_total?: number
          valor_utilizado?: number
        }
        Relationships: [
          {
            foreignKeyName: "antecipacoes_conta_corrente_id_fkey"
            columns: ["conta_corrente_id"]
            isOneToOne: false
            referencedRelation: "contas_correntes"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_correntes: {
        Row: {
          agencia: string
          banco: string
          considerar_saldo: boolean
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
          considerar_saldo?: boolean
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
          considerar_saldo?: boolean
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
      contratos: {
        Row: {
          codigo: string
          created_at: string
          data_fim: string
          data_inicio: string
          data_primeiro_vencimento: string
          descricao: string | null
          empresa_id: string
          favorecido_id: string
          forma_pagamento: string
          gerar_automatico: boolean
          id: string
          observacoes: string | null
          periodicidade: string
          servico_id: string | null
          status: string
          updated_at: string
          valor_mensal: number
          valor_total: number
        }
        Insert: {
          codigo: string
          created_at?: string
          data_fim: string
          data_inicio: string
          data_primeiro_vencimento?: string
          descricao?: string | null
          empresa_id: string
          favorecido_id: string
          forma_pagamento?: string
          gerar_automatico?: boolean
          id?: string
          observacoes?: string | null
          periodicidade?: string
          servico_id?: string | null
          status?: string
          updated_at?: string
          valor_mensal?: number
          valor_total?: number
        }
        Update: {
          codigo?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          data_primeiro_vencimento?: string
          descricao?: string | null
          empresa_id?: string
          favorecido_id?: string
          forma_pagamento?: string
          gerar_automatico?: boolean
          id?: string
          observacoes?: string | null
          periodicidade?: string
          servico_id?: string | null
          status?: string
          updated_at?: string
          valor_mensal?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_contratos_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contratos_favorecido"
            columns: ["favorecido_id"]
            isOneToOne: false
            referencedRelation: "favorecidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contratos_servico"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_parcelas: {
        Row: {
          contrato_id: string
          created_at: string
          data_geracao_conta: string | null
          data_vencimento: string
          id: string
          movimentacao_id: string | null
          numero_parcela: string
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          contrato_id: string
          created_at?: string
          data_geracao_conta?: string | null
          data_vencimento: string
          id?: string
          movimentacao_id?: string | null
          numero_parcela: string
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          contrato_id?: string
          created_at?: string
          data_geracao_conta?: string | null
          data_vencimento?: string
          id?: string
          movimentacao_id?: string | null
          numero_parcela?: string
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_contratos_parcelas_contrato"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contratos_parcelas_movimentacao"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_cards_config: {
        Row: {
          card_id: string
          created_at: string
          empresa_id: string
          id: string
          is_visible: boolean
          order_position: number
          page_id: string
          updated_at: string
        }
        Insert: {
          card_id: string
          created_at?: string
          empresa_id: string
          id?: string
          is_visible?: boolean
          order_position?: number
          page_id?: string
          updated_at?: string
        }
        Update: {
          card_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          is_visible?: boolean
          order_position?: number
          page_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_cards_config_empresa_id_fkey"
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
      fluxo_caixa: {
        Row: {
          antecipacao_id: string | null
          conta_corrente_id: string | null
          created_at: string
          data_movimentacao: string
          descricao: string | null
          empresa_id: string
          forma_pagamento: string | null
          id: string
          movimentacao_id: string | null
          movimentacao_parcela_id: string | null
          origem: string
          saldo: number
          situacao: string
          tipo_operacao: string
          updated_at: string
          valor: number
        }
        Insert: {
          antecipacao_id?: string | null
          conta_corrente_id?: string | null
          created_at?: string
          data_movimentacao: string
          descricao?: string | null
          empresa_id: string
          forma_pagamento?: string | null
          id?: string
          movimentacao_id?: string | null
          movimentacao_parcela_id?: string | null
          origem: string
          saldo: number
          situacao?: string
          tipo_operacao: string
          updated_at?: string
          valor: number
        }
        Update: {
          antecipacao_id?: string | null
          conta_corrente_id?: string | null
          created_at?: string
          data_movimentacao?: string
          descricao?: string | null
          empresa_id?: string
          forma_pagamento?: string | null
          id?: string
          movimentacao_id?: string | null
          movimentacao_parcela_id?: string | null
          origem?: string
          saldo?: number
          situacao?: string
          tipo_operacao?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fluxo_caixa_antecipacao_id_fkey"
            columns: ["antecipacao_id"]
            isOneToOne: false
            referencedRelation: "antecipacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluxo_caixa_conta_corrente_id_fkey"
            columns: ["conta_corrente_id"]
            isOneToOne: false
            referencedRelation: "contas_correntes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluxo_caixa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluxo_caixa_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluxo_caixa_movimentacao_parcela_id_fkey"
            columns: ["movimentacao_parcela_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_parcelas"
            referencedColumns: ["id"]
          },
        ]
      }
      funil_etapas: {
        Row: {
          cor: string
          created_at: string
          funil_id: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          cor: string
          created_at?: string
          funil_id: string
          id?: string
          nome: string
          ordem: number
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          funil_id?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funil_etapas_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
        ]
      }
      funis: {
        Row: {
          ativo: boolean
          created_at: string
          data_criacao: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_criacao?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_criacao?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
      grupo_produtos: {
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
        Relationships: []
      }
      lancamentos_contabeis: {
        Row: {
          conta_credito_id: string | null
          conta_debito_id: string | null
          created_at: string
          data: string
          empresa_id: string
          historico: string
          id: string
          movimentacao_id: string | null
          parcela_id: string | null
          tipo_lancamento: string
          updated_at: string
          valor: number
        }
        Insert: {
          conta_credito_id?: string | null
          conta_debito_id?: string | null
          created_at?: string
          data: string
          empresa_id: string
          historico: string
          id?: string
          movimentacao_id?: string | null
          parcela_id?: string | null
          tipo_lancamento?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          conta_credito_id?: string | null
          conta_debito_id?: string | null
          created_at?: string
          data?: string
          empresa_id?: string
          historico?: string
          id?: string
          movimentacao_id?: string | null
          parcela_id?: string | null
          tipo_lancamento?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_contabeis_conta_credito_id_fkey"
            columns: ["conta_credito_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_conta_debito_id_fkey"
            columns: ["conta_debito_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_parcelas"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          data_criacao: string
          email: string | null
          empresa: string | null
          empresa_id: string
          etapa_id: string
          favorecido_id: string | null
          funil_id: string
          id: string
          nome: string
          observacoes: string | null
          origem_id: string | null
          produto: string | null
          produto_id: string | null
          responsavel_id: string | null
          servico_id: string | null
          status: string
          telefone: string | null
          ultimo_contato: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          data_criacao?: string
          email?: string | null
          empresa?: string | null
          empresa_id: string
          etapa_id: string
          favorecido_id?: string | null
          funil_id: string
          id?: string
          nome: string
          observacoes?: string | null
          origem_id?: string | null
          produto?: string | null
          produto_id?: string | null
          responsavel_id?: string | null
          servico_id?: string | null
          status?: string
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          data_criacao?: string
          email?: string | null
          empresa?: string | null
          empresa_id?: string
          etapa_id?: string
          favorecido_id?: string | null
          funil_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          origem_id?: string | null
          produto?: string | null
          produto_id?: string | null
          responsavel_id?: string | null
          servico_id?: string | null
          status?: string
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_favorecido_id_fkey"
            columns: ["favorecido_id"]
            isOneToOne: false
            referencedRelation: "favorecidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_fechamento: {
        Row: {
          created_at: string
          data: string
          descricao: string | null
          id: string
          lead_id: string
          motivo_perda_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          lead_id: string
          motivo_perda_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          lead_id?: string
          motivo_perda_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_fechamento_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_fechamento_motivo_perda_id_fkey"
            columns: ["motivo_perda_id"]
            isOneToOne: false
            referencedRelation: "motivos_perda"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_interacoes: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          lead_id: string
          responsavel_id: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          id?: string
          lead_id: string
          responsavel_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          lead_id?: string
          responsavel_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos_parametros: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          modulo_key: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          modulo_key: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          modulo_key?: string
          updated_at?: string
        }
        Relationships: []
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
      movimentacoes: {
        Row: {
          categoria_id: string | null
          considerar_dre: boolean
          conta_destino_id: string | null
          conta_origem_id: string | null
          created_at: string
          data_emissao: string | null
          data_lancamento: string
          descricao: string | null
          documento_pdf: string | null
          empresa_id: string
          favorecido_id: string | null
          forma_pagamento: string | null
          id: string
          mes_referencia: string | null
          numero_documento: string | null
          numero_parcelas: number
          primeiro_vencimento: string | null
          tipo_operacao: string
          tipo_titulo_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          considerar_dre?: boolean
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string
          data_emissao?: string | null
          data_lancamento: string
          descricao?: string | null
          documento_pdf?: string | null
          empresa_id: string
          favorecido_id?: string | null
          forma_pagamento?: string | null
          id?: string
          mes_referencia?: string | null
          numero_documento?: string | null
          numero_parcelas?: number
          primeiro_vencimento?: string | null
          tipo_operacao: string
          tipo_titulo_id?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          considerar_dre?: boolean
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string
          data_emissao?: string | null
          data_lancamento?: string
          descricao?: string | null
          documento_pdf?: string | null
          empresa_id?: string
          favorecido_id?: string | null
          forma_pagamento?: string | null
          id?: string
          mes_referencia?: string | null
          numero_documento?: string | null
          numero_parcelas?: number
          primeiro_vencimento?: string | null
          tipo_operacao?: string
          tipo_titulo_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "contas_correntes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "contas_correntes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_favorecido_id_fkey"
            columns: ["favorecido_id"]
            isOneToOne: false
            referencedRelation: "favorecidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_tipo_titulo_id_fkey"
            columns: ["tipo_titulo_id"]
            isOneToOne: false
            referencedRelation: "tipos_titulos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_parcelas: {
        Row: {
          antecipacao_id: string | null
          conta_corrente_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          desconto: number | null
          forma_pagamento: string | null
          id: string
          juros: number | null
          movimentacao_id: string
          multa: number | null
          numero: number
          updated_at: string
          valor: number
          valor_antecipacao_utilizado: number | null
        }
        Insert: {
          antecipacao_id?: string | null
          conta_corrente_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          juros?: number | null
          movimentacao_id: string
          multa?: number | null
          numero: number
          updated_at?: string
          valor: number
          valor_antecipacao_utilizado?: number | null
        }
        Update: {
          antecipacao_id?: string | null
          conta_corrente_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          juros?: number | null
          movimentacao_id?: string
          multa?: number | null
          numero?: number
          updated_at?: string
          valor?: number
          valor_antecipacao_utilizado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_parcelas_antecipacao_id_fkey"
            columns: ["antecipacao_id"]
            isOneToOne: false
            referencedRelation: "antecipacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_parcelas_conta_corrente_id_fkey"
            columns: ["conta_corrente_id"]
            isOneToOne: false
            referencedRelation: "contas_correntes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_parcelas_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_parcelas_antecipacoes: {
        Row: {
          antecipacao_id: string
          created_at: string
          id: string
          movimentacao_parcela_id: string
          updated_at: string
          valor_utilizado: number
        }
        Insert: {
          antecipacao_id: string
          created_at?: string
          id?: string
          movimentacao_parcela_id: string
          updated_at?: string
          valor_utilizado?: number
        }
        Update: {
          antecipacao_id?: string
          created_at?: string
          id?: string
          movimentacao_parcela_id?: string
          updated_at?: string
          valor_utilizado?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_parcelas_antecipacoe_movimentacao_parcela_id_fkey"
            columns: ["movimentacao_parcela_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_parcelas_antecipacoes_antecipacao_id_fkey"
            columns: ["antecipacao_id"]
            isOneToOne: false
            referencedRelation: "antecipacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      numeracao_orcamentos: {
        Row: {
          created_at: string
          empresa_id: string
          proximo_numero: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          proximo_numero?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          proximo_numero?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "numeracao_orcamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
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
          data_venda: string | null
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
          data_venda?: string | null
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
          data_venda?: string | null
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
          categoria: string
          classificacao_dre: string | null
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
          categoria?: string
          classificacao_dre?: string | null
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
          categoria?: string
          classificacao_dre?: string | null
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
      produtos: {
        Row: {
          conta_receita_id: string | null
          created_at: string
          descricao: string | null
          empresa_id: string
          grupo_id: string | null
          id: string
          nome: string
          status: string
          unidade: string
          updated_at: string
        }
        Insert: {
          conta_receita_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id: string
          grupo_id?: string | null
          id?: string
          nome: string
          status?: string
          unidade: string
          updated_at?: string
        }
        Update: {
          conta_receita_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          grupo_id?: string | null
          id?: string
          nome?: string
          status?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_conta_receita_id_fkey"
            columns: ["conta_receita_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupo_produtos"
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
          conta_receita_id: string | null
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          conta_receita_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          conta_receita_id?: string | null
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
            foreignKeyName: "fk_servicos_conta_receita"
            columns: ["conta_receita_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      spreadsheet_data: {
        Row: {
          created_at: string
          dados: Json
          empresa_id: string
          id: string
          linha_numero: number
          tipo_relatorio: string
          upload_file_id: string
        }
        Insert: {
          created_at?: string
          dados: Json
          empresa_id: string
          id?: string
          linha_numero: number
          tipo_relatorio: string
          upload_file_id: string
        }
        Update: {
          created_at?: string
          dados?: Json
          empresa_id?: string
          id?: string
          linha_numero?: number
          tipo_relatorio?: string
          upload_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spreadsheet_data_upload_file_id_fkey"
            columns: ["upload_file_id"]
            isOneToOne: false
            referencedRelation: "upload_files"
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
          produto_id: string | null
          servico_id: string | null
          tabela_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          preco: number
          produto_id?: string | null
          servico_id?: string | null
          tabela_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          preco?: number
          produto_id?: string | null
          servico_id?: string | null
          tabela_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabelas_precos_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
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
      tipos_titulos: {
        Row: {
          conta_contabil_id: string
          conta_desconto_id: string | null
          conta_juros_id: string | null
          conta_multa_id: string | null
          created_at: string
          empresa_id: string
          id: string
          nome: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          conta_contabil_id: string
          conta_desconto_id?: string | null
          conta_juros_id?: string | null
          conta_multa_id?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          conta_contabil_id?: string
          conta_desconto_id?: string | null
          conta_juros_id?: string | null
          conta_multa_id?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_titulos_conta_contabil_id_fkey"
            columns: ["conta_contabil_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_titulos_conta_desconto_id_fkey"
            columns: ["conta_desconto_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_titulos_conta_juros_id_fkey"
            columns: ["conta_juros_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_titulos_conta_multa_id_fkey"
            columns: ["conta_multa_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_titulos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_files: {
        Row: {
          created_at: string
          data_upload: string
          empresa_id: string
          erro_mensagem: string | null
          id: string
          metadados: Json | null
          mime_type: string
          nome_arquivo: string
          status: string
          storage_path: string
          tamanho_bytes: number
          tipo_relatorio: string
          total_linhas: number
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          data_upload?: string
          empresa_id: string
          erro_mensagem?: string | null
          id?: string
          metadados?: Json | null
          mime_type: string
          nome_arquivo: string
          status?: string
          storage_path: string
          tamanho_bytes: number
          tipo_relatorio: string
          total_linhas?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          data_upload?: string
          empresa_id?: string
          erro_mensagem?: string | null
          id?: string
          metadados?: Json | null
          mime_type?: string
          nome_arquivo?: string
          status?: string
          storage_path?: string
          tamanho_bytes?: number
          tipo_relatorio?: string
          total_linhas?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
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
      gerar_parcelas_contrato: {
        Args: { contrato_id_param: string }
        Returns: undefined
      }
      gerar_proximo_numero_orcamento: {
        Args: { empresa_id_param: string }
        Returns: number
      }
      get_monthly_sales_chart_data: {
        Args: { year_param: number }
        Returns: {
          faturado: number
          name: string
        }[]
      }
      get_quarterly_sales_data: {
        Args: { year_param: number }
        Returns: {
          faturado: number
          name: string
        }[]
      }
      get_user_company_id: { Args: never; Returns: string }
      get_yearly_sales_comparison: {
        Args: never
        Returns: {
          media_mensal: number
          num_meses: number
          total: number
          variacao_media: number
          variacao_total: number
          year: number
        }[]
      }
      get_yearly_sales_data: {
        Args: never
        Returns: {
          faturado: number
          name: string
        }[]
      }
    }
    Enums: {
      classificacao_dre_tipo:
        | "receita_bruta"
        | "deducoes"
        | "custos"
        | "despesas_operacionais"
        | "receitas_financeiras"
        | "despesas_financeiras"
        | "distribuicao_lucros"
        | "impostos_irpj_csll"
        | "nao_classificado"
      usuario_status: "ativo" | "inativo"
      usuario_tipo: "Administrador" | "Usuário"
      usuario_vendedor: "sim" | "nao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      classificacao_dre_tipo: [
        "receita_bruta",
        "deducoes",
        "custos",
        "despesas_operacionais",
        "receitas_financeiras",
        "despesas_financeiras",
        "distribuicao_lucros",
        "impostos_irpj_csll",
        "nao_classificado",
      ],
      usuario_status: ["ativo", "inativo"],
      usuario_tipo: ["Administrador", "Usuário"],
      usuario_vendedor: ["sim", "nao"],
    },
  },
} as const
