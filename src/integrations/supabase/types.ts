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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          email: string
          full_name: string | null
          kind: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          email: string
          full_name?: string | null
          kind?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          email?: string
          full_name?: string | null
          kind?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner_id: string | null
          progress: number
          status: string
          target_date: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string | null
          progress?: number
          status?: string
          target_date: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string | null
          progress?: number
          status?: string
          target_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          decided_at: string | null
          end_date: string
          id: string
          leave_type: string
          reason: string
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          decided_at?: string | null
          end_date: string
          id?: string
          leave_type?: string
          reason: string
          start_date: string
          status?: string
          user_id?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          decided_at?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_task_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          user_id: string
          value: Json | null
        }
        Insert: {
          id?: string
          key: string
          user_id?: string
          value?: Json | null
        }
        Update: {
          id?: string
          key?: string
          user_id?: string
          value?: Json | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          completed_at: string | null
          member_id: string
          progress: number
          review_note: string | null
          review_status: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          member_id: string
          progress?: number
          review_note?: string | null
          review_status?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          member_id?: string
          progress?: number
          review_note?: string | null
          review_status?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          id: string
          member_id: string | null
          new_progress: number | null
          old_progress: number | null
          previous_status: Database["public"]["Enums"]["task_status"] | null
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          timestamp: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          member_id?: string | null
          new_progress?: number | null
          old_progress?: number | null
          previous_status?: Database["public"]["Enums"]["task_status"] | null
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          timestamp?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          member_id?: string | null
          new_progress?: number | null
          old_progress?: number | null
          previous_status?: Database["public"]["Enums"]["task_status"] | null
          status?: Database["public"]["Enums"]["task_status"]
          task_id?: string
          timestamp?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          author_name: string
          author_role: string
          created_at: string
          id: string
          message: string
          task_id: string
          user_id: string
        }
        Insert: {
          author_name?: string
          author_role?: string
          created_at?: string
          id?: string
          message: string
          task_id: string
          user_id?: string
        }
        Update: {
          author_name?: string
          author_role?: string
          created_at?: string
          id?: string
          message?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          progress: number
          review_note: string | null
          review_status: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          progress?: number
          review_note?: string | null
          review_status?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          progress?: number
          review_note?: string | null
          review_status?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar: string | null
          created_at: string
          department: string | null
          email: string
          id: string
          is_active: boolean
          joining_date: string | null
          name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          department?: string | null
          email: string
          id?: string
          is_active?: boolean
          joining_date?: string | null
          name: string
          phone?: string | null
          role: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          is_active?: boolean
          joining_date?: string | null
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_logs: {
        Row: {
          attachment_url: string | null
          blockers: string | null
          created_at: string
          date: string
          hours_worked: number
          id: string
          intern_id: string
          notes: string | null
          progress: number
          task_id: string | null
          updated_at: string
          work_completed: string
        }
        Insert: {
          attachment_url?: string | null
          blockers?: string | null
          created_at?: string
          date?: string
          hours_worked?: number
          id?: string
          intern_id?: string
          notes?: string | null
          progress?: number
          task_id?: string | null
          updated_at?: string
          work_completed: string
        }
        Update: {
          attachment_url?: string | null
          blockers?: string | null
          created_at?: string
          date?: string
          hours_worked?: number
          id?: string
          intern_id?: string
          notes?: string | null
          progress?: number
          task_id?: string | null
          updated_at?: string
          work_completed?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_deadlines: { Args: never; Returns: undefined }
      check_in: { Args: never; Returns: undefined }
      check_out: { Args: never; Returns: undefined }
      decide_access: {
        Args: { _approve: boolean; _user_id: string }
        Returns: undefined
      }
      decide_intern_access: {
        Args: { _approve: boolean; _user_id: string }
        Returns: undefined
      }
      decide_leave: {
        Args: { _approve: boolean; _id: string; _note: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      intern_update_goal: {
        Args: { _goal: string; _progress: number }
        Returns: undefined
      }
      intern_update_task: {
        Args: {
          _message: string
          _progress: number
          _status: Database["public"]["Enums"]["task_status"]
          _task: string
        }
        Returns: undefined
      }
      is_approved_intern: { Args: never; Returns: boolean }
      is_my_task: { Args: { _task: string }; Returns: boolean }
      my_member_id: { Args: never; Returns: string }
      my_role: { Args: never; Returns: string }
      notify_admins: {
        Args: { _msg: string; _task: string; _title: string; _type: string }
        Returns: undefined
      }
      refresh_shared_task: { Args: { _task: string }; Returns: undefined }
      request_access: { Args: never; Returns: string }
      request_intern_access: { Args: { _name: string }; Returns: string }
      review_task: {
        Args: { _decision: string; _note: string; _task: string }
        Returns: undefined
      }
      review_task_assignment: {
        Args: {
          _decision: string
          _member: string
          _note: string
          _task: string
        }
        Returns: undefined
      }
      save_shared_task: {
        Args: { _details: Json; _id: string; _members: string[] }
        Returns: string
      }
      set_shared_task_status: {
        Args: {
          _status: Database["public"]["Enums"]["task_status"]
          _task: string
        }
        Returns: undefined
      }
      update_my_profile: {
        Args: { _avatar: string; _phone: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "intern"
      task_priority: "high" | "medium" | "low"
      task_status: "todo" | "in_progress" | "done"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "intern"],
      task_priority: ["high", "medium", "low"],
      task_status: ["todo", "in_progress", "done"],
    },
  },
} as const
