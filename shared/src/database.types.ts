export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  jobhunter: {
    Tables: {
      activities: {
        Row: {
          category: Database["jobhunter"]["Enums"]["activity_category"] | null
          checksum: string | null
          content: string
          created_at: string | null
          event_type: Database["jobhunter"]["Enums"]["activity_event_type"]
          id: string
          job_id: string
          metadata: Json | null
          occurred_at: string
          raw_content: string | null
          user_id: string
        }
        Insert: {
          category?: Database["jobhunter"]["Enums"]["activity_category"] | null
          checksum?: string | null
          content: string
          created_at?: string | null
          event_type?: Database["jobhunter"]["Enums"]["activity_event_type"]
          id?: string
          job_id: string
          metadata?: Json | null
          occurred_at?: string
          raw_content?: string | null
          user_id: string
        }
        Update: {
          category?: Database["jobhunter"]["Enums"]["activity_category"] | null
          checksum?: string | null
          content?: string
          created_at?: string | null
          event_type?: Database["jobhunter"]["Enums"]["activity_event_type"]
          id?: string
          job_id?: string
          metadata?: Json | null
          occurred_at?: string
          raw_content?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          cost: number | null
          created_at: string | null
          feature: Database["jobhunter"]["Enums"]["ai_feature"]
          id: string
          latency_ms: number | null
          model: string
          prompt_summary: string | null
          request_json: Json | null
          response_json: Json | null
          status: Database["jobhunter"]["Enums"]["ai_status"] | null
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          feature: Database["jobhunter"]["Enums"]["ai_feature"]
          id?: string
          latency_ms?: number | null
          model: string
          prompt_summary?: string | null
          request_json?: Json | null
          response_json?: Json | null
          status?: Database["jobhunter"]["Enums"]["ai_status"] | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          feature?: Database["jobhunter"]["Enums"]["ai_feature"]
          id?: string
          latency_ms?: number | null
          model?: string
          prompt_summary?: string | null
          request_json?: Json | null
          response_json?: Json | null
          status?: Database["jobhunter"]["Enums"]["ai_status"] | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content_text: string | null
          created_at: string | null
          doc_type: Database["jobhunter"]["Enums"]["document_type"]
          id: string
          is_primary: boolean | null
          name: string
          storage_path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_text?: string | null
          created_at?: string | null
          doc_type?: Database["jobhunter"]["Enums"]["document_type"]
          id?: string
          is_primary?: boolean | null
          name: string
          storage_path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_text?: string | null
          created_at?: string | null
          doc_type?: Database["jobhunter"]["Enums"]["document_type"]
          id?: string
          is_primary?: boolean | null
          name?: string
          storage_path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          applied_at: string | null
          company: string
          contact_email: string | null
          contact_linkedin: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          date_posted: string | null
          employment_type:
            | Database["jobhunter"]["Enums"]["employment_type"]
            | null
          experience_level: string | null
          id: string
          last_activity: string
          location: string | null
          notes: string | null
          salary_max: number | null
          salary_min: number | null
          skills_tools: string[] | null
          status: Database["jobhunter"]["Enums"]["job_status"]
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          contact_email?: string | null
          contact_linkedin?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          date_posted?: string | null
          employment_type?:
            | Database["jobhunter"]["Enums"]["employment_type"]
            | null
          experience_level?: string | null
          id?: string
          last_activity?: string
          location?: string | null
          notes?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_tools?: string[] | null
          status?: Database["jobhunter"]["Enums"]["job_status"]
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          contact_email?: string | null
          contact_linkedin?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          date_posted?: string | null
          employment_type?:
            | Database["jobhunter"]["Enums"]["employment_type"]
            | null
          experience_level?: string | null
          id?: string
          last_activity?: string
          location?: string | null
          notes?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_tools?: string[] | null
          status?: Database["jobhunter"]["Enums"]["job_status"]
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          default_ai_model: string | null
          email: string
          first_name: string | null
          full_name: string | null
          ghosting_threshold_days: number | null
          id: string
          language: string | null
          last_name: string | null
          onboarding_completed: boolean | null
          openai_api_key: string | null
          professional_headline: string | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          default_ai_model?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          ghosting_threshold_days?: number | null
          id: string
          language?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          openai_api_key?: string | null
          professional_headline?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          default_ai_model?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          ghosting_threshold_days?: number | null
          id?: string
          language?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          openai_api_key?: string | null
          professional_headline?: string | null
          theme?: string | null
          updated_at?: string | null
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
      activity_category:
        | "Interview"
        | "Offer"
        | "Rejection"
        | "Question"
        | "Follow-up"
        | "General"
      activity_event_type:
        | "Manual"
        | "Email"
        | "Call"
        | "Status_Change"
        | "Note"
      ai_feature:
        | "Job_Parsing"
        | "Email_Analysis"
        | "Cover_Letter_Generation"
        | "Smart_Paste"
      ai_status: "Success" | "Failure" | "Partial_Success"
      document_type: "Resume" | "Cover_Letter" | "Portfolio" | "Other"
      employment_type:
        | "Full-time"
        | "Part-time"
        | "Contract"
        | "Internship"
        | "Freelance"
      job_status:
        | "Saved"
        | "Applied"
        | "Interview"
        | "Offer"
        | "Rejected"
        | "Ghosted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  jobhunter: {
    Enums: {
      activity_category: [
        "Interview",
        "Offer",
        "Rejection",
        "Question",
        "Follow-up",
        "General",
      ],
      activity_event_type: ["Manual", "Email", "Call", "Status_Change", "Note"],
      ai_feature: [
        "Job_Parsing",
        "Email_Analysis",
        "Cover_Letter_Generation",
        "Smart_Paste",
      ],
      ai_status: ["Success", "Failure", "Partial_Success"],
      document_type: ["Resume", "Cover_Letter", "Portfolio", "Other"],
      employment_type: [
        "Full-time",
        "Part-time",
        "Contract",
        "Internship",
        "Freelance",
      ],
      job_status: [
        "Saved",
        "Applied",
        "Interview",
        "Offer",
        "Rejected",
        "Ghosted",
      ],
    },
  },
  public: {
    Enums: {},
  },
} as const

