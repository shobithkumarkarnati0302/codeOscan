
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
          improvement_suggestions: string | null
          is_favorite: boolean | null
          user_notes: string | null // Added field for user notes
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
          improvement_suggestions?: string | null
          is_favorite?: boolean | null
          user_notes?: string | null // Added field for user notes
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
          improvement_suggestions?: string | null
          is_favorite?: boolean | null
          user_notes?: string | null // Added field for user notes
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
// and adding the 'improvement_suggestions', 'is_favorite', and 'user_notes' columns,
// generate the types by running:
// npx supabase gen types typescript --project-id your-project-id --schema public > src/lib/database.types.ts
// And replace this file's content with the generated output.
// Ensure RLS policies are set up for the analysis_history table.

// To add the improvement_suggestions column:
// ALTER TABLE public.analysis_history
// ADD COLUMN improvement_suggestions TEXT NULL;

// To add the is_favorite column:
// ALTER TABLE public.analysis_history
// ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;

// To add the user_notes column:
// ALTER TABLE public.analysis_history
// ADD COLUMN user_notes TEXT NULL;
//
// Example RLS policies:
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
// 3. Enable update access for authenticated users on their own records (ensure this covers is_favorite and user_notes):
//    CREATE POLICY "Enable update for own user" ON "public"."analysis_history"
//    AS PERMISSIVE FOR UPDATE
//    TO authenticated
//    USING ((auth.uid() = user_id))
//    WITH CHECK ((auth.uid() = user_id));
// 4. Enable delete access for authenticated users on their own records:
//    CREATE POLICY "Enable delete for own user" ON "public"."analysis_history"
//    AS PERMISSIVE FOR DELETE
//    TO authenticated
//    USING ((auth.uid() = user_id));
// 5. (Optional, for public share links) Enable public read if an 'is_public' flag is true:
//    -- First, add the column: ALTER TABLE public.analysis_history ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
//    -- Then, add this policy:
//    -- CREATE POLICY "Enable public read for shared items" ON "public"."analysis_history"
//    -- AS PERMISSIVE FOR SELECT
//    -- TO anon, authenticated
//    -- USING (is_public = TRUE);
    
