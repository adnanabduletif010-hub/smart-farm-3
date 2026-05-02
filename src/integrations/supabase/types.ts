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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      crop_guides: {
        Row: {
          created_at: string
          emoji: string | null
          fertilizer_am: string | null
          fertilizer_en: string | null
          fertilizer_om: string | null
          harvest_am: string | null
          harvest_en: string | null
          harvest_om: string | null
          id: string
          name_am: string | null
          name_en: string
          name_om: string | null
          pests_am: string | null
          pests_en: string | null
          pests_om: string | null
          slug: string
          soil_am: string | null
          soil_en: string | null
          soil_om: string | null
          spacing_am: string | null
          spacing_en: string | null
          spacing_om: string | null
          updated_at: string
          water_am: string | null
          water_en: string | null
          water_om: string | null
          zone_am: string | null
          zone_en: string | null
          zone_om: string | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          fertilizer_am?: string | null
          fertilizer_en?: string | null
          fertilizer_om?: string | null
          harvest_am?: string | null
          harvest_en?: string | null
          harvest_om?: string | null
          id?: string
          name_am?: string | null
          name_en: string
          name_om?: string | null
          pests_am?: string | null
          pests_en?: string | null
          pests_om?: string | null
          slug: string
          soil_am?: string | null
          soil_en?: string | null
          soil_om?: string | null
          spacing_am?: string | null
          spacing_en?: string | null
          spacing_om?: string | null
          updated_at?: string
          water_am?: string | null
          water_en?: string | null
          water_om?: string | null
          zone_am?: string | null
          zone_en?: string | null
          zone_om?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          fertilizer_am?: string | null
          fertilizer_en?: string | null
          fertilizer_om?: string | null
          harvest_am?: string | null
          harvest_en?: string | null
          harvest_om?: string | null
          id?: string
          name_am?: string | null
          name_en?: string
          name_om?: string | null
          pests_am?: string | null
          pests_en?: string | null
          pests_om?: string | null
          slug?: string
          soil_am?: string | null
          soil_en?: string | null
          soil_om?: string | null
          spacing_am?: string | null
          spacing_en?: string | null
          spacing_om?: string | null
          updated_at?: string
          water_am?: string | null
          water_en?: string | null
          water_om?: string | null
          zone_am?: string | null
          zone_en?: string | null
          zone_om?: string | null
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          confidence: string | null
          created_at: string
          crop: string | null
          disease: string | null
          home_remedy: string | null
          id: string
          image_url: string | null
          scientific_solution: string | null
          user_id: string | null
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          crop?: string | null
          disease?: string | null
          home_remedy?: string | null
          id?: string
          image_url?: string | null
          scientific_solution?: string | null
          user_id?: string | null
        }
        Update: {
          confidence?: string | null
          created_at?: string
          crop?: string | null
          disease?: string | null
          home_remedy?: string | null
          id?: string
          image_url?: string | null
          scientific_solution?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expert_questions: {
        Row: {
          created_at: string
          id: string
          question: string
          status: string | null
          topic: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          status?: string | null
          topic?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question?: string
          status?: string | null
          topic?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expert_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          question_id: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          question_id: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_replies_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "expert_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_device_tokens: {
        Row: {
          created_at: string
          device_name: string
          field_name: string | null
          id: string
          last_used_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name: string
          field_name?: string | null
          id?: string
          last_used_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string
          field_name?: string | null
          id?: string
          last_used_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          category: string | null
          contact: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          price: number
          quantity: number | null
          title: string
          type: string
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number
          quantity?: number | null
          title: string
          type?: string
          unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number
          quantity?: number | null
          title?: string
          type?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "research_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      research_posts: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          published_at: string | null
          source: string | null
          summary: string | null
          title: string
          topic: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source?: string | null
          summary?: string | null
          title: string
          topic?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source?: string | null
          summary?: string | null
          title?: string
          topic?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      soil_readings: {
        Row: {
          created_at: string
          device_name: string | null
          field_name: string | null
          id: string
          moisture: number | null
          nitrogen: number | null
          notes: string | null
          ph: number | null
          phosphorus: number | null
          potassium: number | null
          source: string
          temperature: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          field_name?: string | null
          id?: string
          moisture?: number | null
          nitrogen?: number | null
          notes?: string | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          source?: string
          temperature?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_name?: string | null
          field_name?: string | null
          id?: string
          moisture?: number | null
          nitrogen?: number | null
          notes?: string | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          source?: string
          temperature?: number | null
          user_id?: string | null
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          topic: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          topic?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          topic?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      listings_public: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          location: string | null
          price: number | null
          quantity: number | null
          title: string | null
          type: string | null
          unit: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          price?: number | null
          quantity?: number | null
          title?: string | null
          type?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          price?: number | null
          quantity?: number | null
          title?: string | null
          type?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_account_type: {
        Args: never
        Returns: Database["public"]["Enums"]["account_type"]
      }
      get_listing_contact: { Args: { _listing_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "farmer" | "expert" | "research_center"
      app_role: "admin" | "moderator" | "user"
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
      account_type: ["farmer", "expert", "research_center"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
