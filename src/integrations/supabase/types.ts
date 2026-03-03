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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          employee_id: string | null
          employer_id: string | null
          first_name: string
          id: string
          last_name: string
          ssn_last_four: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          employee_id?: string | null
          employer_id?: string | null
          first_name: string
          id?: string
          last_name: string
          ssn_last_four?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          employee_id?: string | null
          employer_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          ssn_last_four?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
        ]
      }
      employers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string
          created_at: string
          ein: string | null
          email: string | null
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name: string
          created_at?: string
          ein?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string
          created_at?: string
          ein?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean | null
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean | null
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generation_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          paystub_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          paystub_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          paystub_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_logs_paystub_id_fkey"
            columns: ["paystub_id"]
            isOneToOne: false
            referencedRelation: "paystubs"
            referencedColumns: ["id"]
          },
        ]
      }
      paystubs: {
        Row: {
          bonus: number | null
          commission: number | null
          created_at: string
          employee_id: string | null
          employer_id: string | null
          federal_tax: number | null
          gross_pay: number | null
          health_insurance: number | null
          hourly_rate: number | null
          id: string
          is_hourly: boolean | null
          is_watermarked: boolean | null
          medicare: number | null
          net_pay: number | null
          other_deductions: number | null
          other_earnings: number | null
          overtime_hours: number | null
          overtime_rate: number | null
          pay_date: string
          pay_frequency: Database["public"]["Enums"]["pay_frequency"] | null
          pay_period_end: string
          pay_period_start: string
          pdf_url: string | null
          regular_hours: number | null
          retirement_401k: number | null
          salary_amount: number | null
          social_security: number | null
          state_code: string | null
          state_tax: number | null
          status: Database["public"]["Enums"]["paystub_status"] | null
          template_id: string | null
          tips: number | null
          total_deductions: number | null
          updated_at: string
          user_id: string
          ytd_federal_tax: number | null
          ytd_gross: number | null
          ytd_medicare: number | null
          ytd_net: number | null
          ytd_social_security: number | null
          ytd_state_tax: number | null
        }
        Insert: {
          bonus?: number | null
          commission?: number | null
          created_at?: string
          employee_id?: string | null
          employer_id?: string | null
          federal_tax?: number | null
          gross_pay?: number | null
          health_insurance?: number | null
          hourly_rate?: number | null
          id?: string
          is_hourly?: boolean | null
          is_watermarked?: boolean | null
          medicare?: number | null
          net_pay?: number | null
          other_deductions?: number | null
          other_earnings?: number | null
          overtime_hours?: number | null
          overtime_rate?: number | null
          pay_date: string
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"] | null
          pay_period_end: string
          pay_period_start: string
          pdf_url?: string | null
          regular_hours?: number | null
          retirement_401k?: number | null
          salary_amount?: number | null
          social_security?: number | null
          state_code?: string | null
          state_tax?: number | null
          status?: Database["public"]["Enums"]["paystub_status"] | null
          template_id?: string | null
          tips?: number | null
          total_deductions?: number | null
          updated_at?: string
          user_id: string
          ytd_federal_tax?: number | null
          ytd_gross?: number | null
          ytd_medicare?: number | null
          ytd_net?: number | null
          ytd_social_security?: number | null
          ytd_state_tax?: number | null
        }
        Update: {
          bonus?: number | null
          commission?: number | null
          created_at?: string
          employee_id?: string | null
          employer_id?: string | null
          federal_tax?: number | null
          gross_pay?: number | null
          health_insurance?: number | null
          hourly_rate?: number | null
          id?: string
          is_hourly?: boolean | null
          is_watermarked?: boolean | null
          medicare?: number | null
          net_pay?: number | null
          other_deductions?: number | null
          other_earnings?: number | null
          overtime_hours?: number | null
          overtime_rate?: number | null
          pay_date?: string
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"] | null
          pay_period_end?: string
          pay_period_start?: string
          pdf_url?: string | null
          regular_hours?: number | null
          retirement_401k?: number | null
          salary_amount?: number | null
          social_security?: number | null
          state_code?: string | null
          state_tax?: number | null
          status?: Database["public"]["Enums"]["paystub_status"] | null
          template_id?: string | null
          tips?: number | null
          total_deductions?: number | null
          updated_at?: string
          user_id?: string
          ytd_federal_tax?: number | null
          ytd_gross?: number | null
          ytd_medicare?: number | null
          ytd_net?: number | null
          ytd_social_security?: number | null
          ytd_state_tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paystubs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paystubs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stubs_generated_this_month: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stubs_generated_this_month?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stubs_generated_this_month?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          created_at: string
          effective_date: string | null
          federal_rate: number | null
          has_state_tax: boolean | null
          id: string
          medicare_rate: number | null
          social_security_rate: number | null
          state_code: string
          state_name: string
          state_rate: number | null
          version: number | null
        }
        Insert: {
          created_at?: string
          effective_date?: string | null
          federal_rate?: number | null
          has_state_tax?: boolean | null
          id?: string
          medicare_rate?: number | null
          social_security_rate?: number | null
          state_code: string
          state_name: string
          state_rate?: number | null
          version?: number | null
        }
        Update: {
          created_at?: string
          effective_date?: string | null
          federal_rate?: number | null
          has_state_tax?: boolean | null
          id?: string
          medicare_rate?: number | null
          social_security_rate?: number | null
          state_code?: string
          state_name?: string
          state_rate?: number | null
          version?: number | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          configuration: Json | null
          created_at: string
          description: string | null
          id: string
          industry_tags: string[] | null
          is_premium: boolean | null
          name: string
          preview_image_url: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          description?: string | null
          id: string
          industry_tags?: string[] | null
          is_premium?: boolean | null
          name: string
          preview_image_url?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          industry_tags?: string[] | null
          is_premium?: boolean | null
          name?: string
          preview_image_url?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          description: string | null
          id: string
          paystub_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          paystub_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          paystub_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_paystub_id_fkey"
            columns: ["paystub_id"]
            isOneToOne: false
            referencedRelation: "paystubs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_moderator_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      pay_frequency: "weekly" | "bi_weekly" | "semi_monthly" | "monthly"
      paystub_status: "draft" | "completed" | "downloaded"
      subscription_status: "active" | "cancelled" | "past_due" | "trialing"
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
      app_role: ["admin", "moderator", "user"],
      pay_frequency: ["weekly", "bi_weekly", "semi_monthly", "monthly"],
      paystub_status: ["draft", "completed", "downloaded"],
      subscription_status: ["active", "cancelled", "past_due", "trialing"],
    },
  },
} as const
