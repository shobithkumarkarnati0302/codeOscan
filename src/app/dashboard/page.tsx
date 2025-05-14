
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalysisInteraction } from "@/components/analyzer/AnalysisInteraction";
import { AnalysisHistory } from "@/components/analyzer/AnalysisHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <AnalysisInteraction />
      <Card className="shadow-lg">
         <CardHeader>
          <CardTitle className="text-2xl">Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisHistory userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
