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
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: number
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          client_id: number | null
          contact_date: string | null
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string | null
          created_by_user_id: string | null
          follow_up_date: string | null
          id: string
          notes: string | null
          project_id: string | null
          subject: string
        }
        Insert: {
          client_id?: number | null
          contact_date?: string | null
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at?: string | null
          created_by_user_id?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          subject: string
        }
        Update: {
          client_id?: number | null
          contact_date?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string | null
          created_by_user_id?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "crm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_projects: {
        Row: {
          actual_completion: string | null
          budget_range: string | null
          client_id: number | null
          created_at: string | null
          description: string | null
          expected_completion: string | null
          id: string
          name: string
          project_type: Database["public"]["Enums"]["project_type"]
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_completion?: string | null
          budget_range?: string | null
          client_id?: number | null
          created_at?: string | null
          description?: string | null
          expected_completion?: string | null
          id?: string
          name: string
          project_type?: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_completion?: string | null
          budget_range?: string | null
          client_id?: number | null
          created_at?: string | null
          description?: string | null
          expected_completion?: string | null
          id?: string
          name?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to_user_id: string | null
          client_id: number | null
          completed: boolean | null
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          client_id?: number | null
          completed?: boolean | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          client_id?: number | null
          completed?: boolean | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "crm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_files: {
        Row: {
          created_at: string
          customer_id: string
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          id: string
          storage_object_path: string
          updated_at: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          storage_object_path: string
          updated_at?: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          storage_object_path?: string
          updated_at?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      table_data: {
        Row: {
          columns: Json
          created_at: string
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          columns: Json
          created_at?: string
          data: Json
          id?: string
          updated_at?: string
        }
        Update: {
          columns?: Json
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
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
      client_stage: "lead" | "prospect" | "active" | "completed" | "on_hold"
      contact_type: "phone" | "email" | "meeting" | "site_visit" | "proposal"
      project_type:
        | "residential"
        | "commercial"
        | "interior_design"
        | "renovation"
        | "consultation"
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
      client_stage: ["lead", "prospect", "active", "completed", "on_hold"],
      contact_type: ["phone", "email", "meeting", "site_visit", "proposal"],
      project_type: [
        "residential",
        "commercial",
        "interior_design",
        "renovation",
        "consultation",
      ],
    },
  },
} as const
