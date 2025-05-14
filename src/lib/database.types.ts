
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      analysis_history: {
        Row: {
          id: string
          user_id: string
          created_at: string
          title: string | null
          language: string
          code_snippet: string
          time_complexity: string | null
          space_complexity: string | null
          explanation: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          title?: string | null
          language: string
          code_snippet: string
          time_complexity?: string | null
          space_complexity?: string | null
          explanation?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          title?: string | null
          language?: string
          code_snippet?: string
          time_complexity?: string | null
          space_complexity?: string | null
          explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Note: After creating the 'analysis_history' table in your Supabase project,
// generate the types by running:
// npx supabase gen types typescript --project-id your-project-id --schema public > src/lib/database.types.ts
// And replace this file's content with the generated output.
// Ensure RLS policies are set up for the analysis_history table.
// Example policies:
// 1. Enable read access for authenticated users on their own records:
//    CREATE POLICY "Enable read access for own user" ON "public"."analysis_history"
//    AS PERMISSIVE FOR SELECT
//    TO authenticated
//    USING ((auth.uid() = user_id))
// 2. Enable insert access for authenticated users:
//    CREATE POLICY "Enable insert for authenticated users" ON "public"."analysis_history"
//    AS PERMISSIVE FOR INSERT
//    TO authenticated
//    WITH CHECK ((auth.uid() = user_id))

