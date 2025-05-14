
"use server";

import { createClient } from "@/lib/supabase/server";
import { analyzeCodeComplexity, type AnalyzeCodeComplexityInput } from "@/ai/flows/analyze-code-complexity";
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
    explanationLevel: explanationLevel || undefined, // Ensure it's undefined if empty string
  };

  try {
    const analysisOutput = await analyzeCodeComplexity(analysisInput);

    const { error: dbError } = await supabase
      .from("analysis_history")
      .insert({
        user_id: user.id,
        title: title,
        language: language,
        code_snippet: code,
        time_complexity: analysisOutput.timeComplexity,
        space_complexity: analysisOutput.spaceComplexity,
        explanation: analysisOutput.explanation,
        // explanation_level is not saved to DB in this iteration
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return { error: "Failed to save analysis to history. " + dbError.message, data: analysisOutput };
    }
    
    // Removed revalidatePath("/dashboard") to let client-side real-time handle updates for AnalysisHistory
    // revalidatePath("/dashboard"); 
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

  revalidatePath("/dashboard"); // Keep for other potential server components or if history itself becomes server-rendered
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
  
  // For this version, we are not re-analyzing. 
  // We are only updating the user-editable fields.
  // The AI-generated fields (time_complexity, space_complexity, explanation) remain unchanged.
  // If re-analysis is desired, this function would need to call `analyzeCodeComplexity` again.

  const updateData: Partial<Database["public"]["Tables"]["analysis_history"]["Row"]> = {
    title: title || `Analysis for ${language}`,
    language: language,
    code_snippet: code,
    // updated_at: new Date().toISOString(), // If you add an updated_at column
  };

  const { error } = await supabase
    .from("analysis_history")
    .update(updateData)
    .match({ id: id, user_id: user.id });

  if (error) {
    console.error("Database error updating item:", error);
    return { error: "Failed to update history item: " + error.message };
  }

  revalidatePath("/dashboard"); // Keep for other potential server components
  return { error: null };
}

