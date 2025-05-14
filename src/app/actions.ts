
"use server";

import { createClient } from "@/lib/supabase/server";
import { analyzeCodeComplexity, type AnalyzeCodeComplexityInput, type AnalyzeCodeComplexityOutput } from "@/ai/flows/analyze-code-complexity";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/database.types";

export async function handleLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return error.message;
  }
  revalidatePath("/", "layout"); 
  redirect("/dashboard");
}

export async function handleSignUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();
  
  const origin = headers().get("origin");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return error.message;
  }
  revalidatePath("/", "layout");
  return null; 
}

export async function analyzeAndSaveCode(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated.", data: null };
  }

  const title = formData.get("title") as string;
  const language = formData.get("language") as string;
  const code = formData.get("code") as string;
  const explanationLevel = formData.get("explanationLevel") as string | undefined;

  if (!language || !code) {
    return { error: "Language and code snippet are required.", data: null };
  }

  const analysisInput: AnalyzeCodeComplexityInput = {
    title,
    language,
    code,
    explanationLevel: explanationLevel || undefined, 
  };

  try {
    const analysisOutput: AnalyzeCodeComplexityOutput = await analyzeCodeComplexity(analysisInput);

    const { error: dbError } = await supabase
      .from("analysis_history")
      .insert({
        user_id: user.id,
        title: title || `Analysis for ${language}`, 
        language: language,
        code_snippet: code,
        time_complexity: analysisOutput.timeComplexity,
        space_complexity: analysisOutput.spaceComplexity,
        explanation: analysisOutput.explanation,
        improvement_suggestions: analysisOutput.improvementSuggestions,
        is_favorite: false, 
        user_notes: "", // Initialize user_notes
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return { error: "Failed to save analysis to history. " + dbError.message, data: analysisOutput };
    }
    
    return { error: null, data: analysisOutput };

  } catch (aiError: any) {
    console.error("AI analysis error:", aiError);
    return { error: "AI analysis failed: " + (aiError.message || "Unknown error"), data: null };
  }
}

export async function deleteAnalysisHistoryItem(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated." };
  }

  const { error } = await supabase
    .from("analysis_history")
    .delete()
    .match({ id: id, user_id: user.id });

  if (error) {
    console.error("Database error deleting item:", error);
    return { error: "Failed to delete history item: " + error.message };
  }

  return { error: null };
}

export async function updateAnalysisHistoryItem(id: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated." };
  }

  const title = formData.get("title") as string;
  const language = formData.get("language") as string;
  const code = formData.get("code") as string;

  if (!language || !code) {
    return { error: "Language and code snippet are required." };
  }
  
  const updateData: Partial<Database["public"]["Tables"]["analysis_history"]["Row"]> = {
    title: title || `Analysis for ${language}`,
    language: language,
    code_snippet: code,
  };

  const { error } = await supabase
    .from("analysis_history")
    .update(updateData)
    .match({ id: id, user_id: user.id });

  if (error) {
    console.error("Database error updating item:", error);
    return { error: "Failed to update history item: " + error.message };
  }

  return { error: null };
}

export async function toggleFavoriteStatus(id: string, currentStatus: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated." };
  }

  const { error } = await supabase
    .from("analysis_history")
    .update({ is_favorite: !currentStatus })
    .match({ id: id, user_id: user.id });

  if (error) {
    console.error("Database error updating favorite status:", error);
    return { error: "Failed to update favorite status: " + error.message };
  }

  return { error: null };
}

export async function updateUserNotes(analysisId: string, notes: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated." };
  }

  const { error } = await supabase
    .from("analysis_history")
    .update({ user_notes: notes })
    .match({ id: analysisId, user_id: user.id });

  if (error) {
    console.error("Database error updating notes:", error);
    return { error: "Failed to update notes: " + error.message };
  }
  // Optionally revalidate if immediate reflection on other components is needed,
  // though AnalysisHistory typically relies on real-time for updates.
  // revalidatePath("/dashboard"); 
  return { error: null };
}

export async function getAnalysisByIdForSharing(analysisId: string): Promise<{ data: Database["public"]["Tables"]["analysis_history"]["Row"] | null; error: string | null }> {
  const supabase = createClient();
  // Note: This fetch does not explicitly check user authentication.
  // For this to work for unauthenticated users (truly public link),
  // your RLS policies for `analysis_history` must allow `anon` role to SELECT.
  // This might involve an `is_public` flag on the table.
  // If RLS restricts to authenticated users, only logged-in users can view shared links.
  const { data, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("id", analysisId)
    .single();

  if (error) {
    console.error("Error fetching analysis by ID for sharing:", error);
    return { data: null, error: "Failed to fetch analysis: " + error.message };
  }

  return { data, error: null };
}
    
