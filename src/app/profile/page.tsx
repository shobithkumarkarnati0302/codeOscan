
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalysisHistory } from "@/components/analyzer/AnalysisHistory";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Your Profile
        </h1>
        <p className="text-muted-foreground">
          View and manage your analysis history.
        </p>
      </header>
      <Card className="shadow-xl">
        {/* AnalysisHistory component already includes its own title "Analysis History" */}
        <CardContent className="p-0 md:p-0"> {/* Adjusted padding to avoid double padding with AnalysisHistory */}
          <AnalysisHistory userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
