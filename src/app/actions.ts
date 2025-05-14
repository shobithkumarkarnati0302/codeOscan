
"use server";

import { createClient } from "@/lib/supabase/server";
import { analyzeCodeComplexity, type AnalyzeCodeComplexityInput } from "@/ai/flows/analyze-code-complexity";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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
  // Successful login will be handled by middleware redirecting to /dashboard
  // For client-side updates, we might need to revalidate or redirect explicitly
  revalidatePath("/", "layout"); // Revalidate all paths to update auth state
  redirect("/dashboard");
}

export async function handleSignUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();
  
  // For Next.js SSR, ensure origin is correctly set for email confirmation links
  const origin = headers().get("origin");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`, // You would need an /auth/callback route if not using middleware for this
    },
  });

  if (error) {
    return error.message;
  }
  // Successful sign-up will typically send a confirmation email.
  // User will then verify, and login.
  revalidatePath("/", "layout");
  return null; // Indicate success, user should check email
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

  if (!language || !code) {
    return { error: "Language and code snippet are required.", data: null };
  }

  const analysisInput: AnalyzeCodeComplexityInput = {
    title,
    language,
    code,
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
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return { error: "Failed to save analysis to history. " + dbError.message, data: analysisOutput };
    }
    
    revalidatePath("/dashboard"); // Revalidate dashboard to show new history item
    return { error: null, data: analysisOutput };

  } catch (aiError: any) {
    console.error("AI analysis error:", aiError);
    return { error: "AI analysis failed: " + (aiError.message || "Unknown error"), data: null };
  }
}