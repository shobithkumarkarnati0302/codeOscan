
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Logo } from "@/components/icons/Logo";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center bg-gradient-to-br from-background to-secondary/30">
      <div className="mb-8">
        <Logo width="200" height="50" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
        Analyze Code Complexity with AI
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
        Understand the efficiency of your algorithms. Get instant time and space
        complexity analysis for your code snippets.
      </p>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mb-12 text-left">
        <div className="p-6 bg-card rounded-lg shadow-md">
          <CheckCircle className="h-6 w-6 text-primary mb-2" />
          <h3 className="text-lg font-semibold mb-1">Instant Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Paste your code and get complexity insights in seconds.
          </p>
        </div>
        <div className="p-6 bg-card rounded-lg shadow-md">
          <CheckCircle className="h-6 w-6 text-primary mb-2" />
          <h3 className="text-lg font-semibold mb-1">Multiple Languages</h3>
          <p className="text-sm text-muted-foreground">
            Supports popular languages like Python, JavaScript, Java, and more.
          </p>
        </div>
        <div className="p-6 bg-card rounded-lg shadow-md">
          <CheckCircle className="h-6 w-6 text-primary mb-2" />
          <h3 className="text-lg font-semibold mb-1">Track Your History</h3>
          <p className="text-sm text-muted-foreground">
            Authenticated users can save and review past analyses.
          </p>
        </div>
      </div>
      <Button asChild size="lg" className="shadow-lg">
        <Link href="/login">
          Get Started <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
}