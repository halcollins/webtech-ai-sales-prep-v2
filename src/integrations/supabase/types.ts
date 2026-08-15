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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      briefing_contacts: {
        Row: {
          briefing_id: string
          contact_enrichment: Json | null
          contact_enrichment_md: string | null
          created_at: string
          id: string
          linkedin_text: string | null
          linkedin_url: string
          person_name: string
          person_title: string | null
          user_id: string
        }
        Insert: {
          briefing_id: string
          contact_enrichment?: Json | null
          contact_enrichment_md?: string | null
          created_at?: string
          id?: string
          linkedin_text?: string | null
          linkedin_url: string
          person_name: string
          person_title?: string | null
          user_id: string
        }
        Update: {
          briefing_id?: string
          contact_enrichment?: Json | null
          contact_enrichment_md?: string | null
          created_at?: string
          id?: string
          linkedin_text?: string | null
          linkedin_url?: string
          person_name?: string
          person_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefing_contacts_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          company_briefing: Json | null
          company_briefing_md: string | null
          company_context: Json | null
          company_name: string
          company_url: string
          confidence_score: number | null
          created_at: string
          id: string
          industry: string | null
          known_pain: string | null
          meeting_type: string | null
          notes: string | null
          region: string | null
          status: string
          target_contact_type: string
          updated_at: string
          user_id: string
          website_sources: Json | null
        }
        Insert: {
          company_briefing?: Json | null
          company_briefing_md?: string | null
          company_context?: Json | null
          company_name: string
          company_url: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          industry?: string | null
          known_pain?: string | null
          meeting_type?: string | null
          notes?: string | null
          region?: string | null
          status?: string
          target_contact_type: string
          updated_at?: string
          user_id: string
          website_sources?: Json | null
        }
        Update: {
          company_briefing?: Json | null
          company_briefing_md?: string | null
          company_context?: Json | null
          company_name?: string
          company_url?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          industry?: string | null
          known_pain?: string | null
          meeting_type?: string | null
          notes?: string | null
          region?: string | null
          status?: string
          target_contact_type?: string
          updated_at?: string
          user_id?: string
          website_sources?: Json | null
        }
        Relationships: []
      }
      company_profile: {
        Row: {
          ai_model: string
          banned_words: Json
          bot_user_agent: string
          company_name: string
          competitors: Json
          disqualifiers: Json
          id: string
          known_objections: Json
          org_id: string
          price_range: string | null
          proof_points: Json
          rep_experience_level: string
          singleton: boolean
          standard_faqs: Json
          trigger_signals: Json
          updated_at: string
          website: string | null
          what_we_sell: Json
          who_we_serve: string | null
        }
        Insert: {
          ai_model?: string
          banned_words?: Json
          bot_user_agent?: string
          company_name: string
          competitors?: Json
          disqualifiers?: Json
          id?: string
          known_objections?: Json
          org_id?: string
          price_range?: string | null
          proof_points?: Json
          rep_experience_level?: string
          singleton?: boolean
          standard_faqs?: Json
          trigger_signals?: Json
          updated_at?: string
          website?: string | null
          what_we_sell?: Json
          who_we_serve?: string | null
        }
        Update: {
          ai_model?: string
          banned_words?: Json
          bot_user_agent?: string
          company_name?: string
          competitors?: Json
          disqualifiers?: Json
          id?: string
          known_objections?: Json
          org_id?: string
          price_range?: string | null
          proof_points?: Json
          rep_experience_level?: string
          singleton?: boolean
          standard_faqs?: Json
          trigger_signals?: Json
          updated_at?: string
          website?: string | null
          what_we_sell?: Json
          who_we_serve?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
