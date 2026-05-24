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
      chores: {
        Row: {
          category: string | null
          emoji: string
          home_id: string
          id: string
          name: string
          threshold_days: number | null
        }
        Insert: {
          category?: string | null
          emoji: string
          home_id: string
          id?: string
          name: string
          threshold_days?: number | null
        }
        Update: {
          category?: string | null
          emoji?: string
          home_id?: string
          id?: string
          name?: string
          threshold_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chores_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      color_trades: {
        Row: {
          created_at: string
          from_member_id: string
          home_id: string
          id: string
          status: string
          to_member_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_member_id: string
          home_id: string
          id?: string
          status?: string
          to_member_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_member_id?: string
          home_id?: string
          id?: string
          status?: string
          to_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "color_trades_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "color_trades_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "color_trades_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_slots: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          day_of_week: number
          fed_at: string | null
          fed_by: string | null
          feedings: Json | null
          home_id: string | null
          id: string
          pet_id: string | null
          slot: string
          week_start: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          day_of_week: number
          fed_at?: string | null
          fed_by?: string | null
          feedings?: Json | null
          home_id?: string | null
          id?: string
          pet_id?: string | null
          slot: string
          week_start: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          day_of_week?: number
          fed_at?: string | null
          fed_by?: string | null
          feedings?: Json | null
          home_id?: string | null
          id?: string
          pet_id?: string | null
          slot?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_slots_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_slots_fed_by_fkey"
            columns: ["fed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_slots_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_slots_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_trades: {
        Row: {
          created_at: string
          from_member_id: string
          home_id: string
          id: string
          slot_id: string
          status: string
          to_member_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_member_id: string
          home_id: string
          id?: string
          slot_id: string
          status?: string
          to_member_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_member_id?: string
          home_id?: string
          id?: string
          slot_id?: string
          status?: string
          to_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_trades_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_trades_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_trades_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "feeding_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_trades_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      home_members: {
        Row: {
          home_id: string
          joined_at: string | null
          member_id: string
        }
        Insert: {
          home_id: string
          joined_at?: string | null
          member_id: string
        }
        Update: {
          home_id?: string
          joined_at?: string | null
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_members_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      homes: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          chore_id: string
          done_at: string
          home_id: string
          id: string
          member_id: string
          metadata: Json | null
        }
        Insert: {
          chore_id: string
          done_at?: string
          home_id: string
          id?: string
          member_id: string
          metadata?: Json | null
        }
        Update: {
          chore_id?: string
          done_at?: string
          home_id?: string
          id?: string
          member_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_achievements: {
        Row: {
          achievement_id: string
          home_id: string
          id: string
          member_id: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          home_id: string
          id?: string
          member_id: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          home_id?: string
          id?: string
          member_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_achievements_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_achievements_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          avatar_url: string | null
          color: string
          home_id: string
          id: string
          name: string
          notification_prefs: Json | null
          pin: string
          role: string
          selected_title: string | null
        }
        Insert: {
          avatar_url?: string | null
          color: string
          home_id: string
          id?: string
          name: string
          notification_prefs?: Json | null
          pin?: string
          role?: string
          selected_title?: string | null
        }
        Update: {
          avatar_url?: string | null
          color?: string
          home_id?: string
          id?: string
          name?: string
          notification_prefs?: Json | null
          pin?: string
          role?: string
          selected_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          created_at: string
          home_id: string
          id: string
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string
          home_id: string
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string
          home_id?: string
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_votes: {
        Row: {
          created_at: string
          home_id: string
          id: string
          member_id: string
          proposal_id: string
        }
        Insert: {
          created_at?: string
          home_id: string
          id?: string
          member_id: string
          proposal_id: string
        }
        Update: {
          created_at?: string
          home_id?: string
          id?: string
          member_id?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_votes_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          category: string
          created_at: string
          created_by: string
          emoji: string
          home_id: string
          id: string
          name: string
          status: string
          threshold_days: number
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          emoji: string
          home_id: string
          id?: string
          name: string
          status?: string
          threshold_days?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          emoji?: string
          home_id?: string
          id?: string
          name?: string
          status?: string
          threshold_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          home_id: string
          id: string
          member_id: string
          p256dh: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          home_id: string
          id?: string
          member_id: string
          p256dh: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          home_id?: string
          id?: string
          member_id?: string
          p256dh?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      thanks: {
        Row: {
          created_at: string
          from_member_id: string
          home_id: string
          id: string
          log_id: string
          reaction_type: string
          to_member_id: string
        }
        Insert: {
          created_at?: string
          from_member_id: string
          home_id: string
          id?: string
          log_id: string
          reaction_type?: string
          to_member_id: string
        }
        Update: {
          created_at?: string
          from_member_id?: string
          home_id?: string
          id?: string
          log_id?: string
          reaction_type?: string
          to_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thanks_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thanks_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thanks_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thanks_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      onboard_home: {
        Args: {
          p_chores: Json
          p_home_name: string
          p_members: Json
          p_pets: Json
        }
        Returns: string
      }
      swap_member_colors: {
        Args: { member_a_id: string; member_b_id: string }
        Returns: undefined
      }
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
  public: {
    Enums: {},
  },
} as const
