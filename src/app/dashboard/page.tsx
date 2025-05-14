
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalysisInteraction } from "@/components/analyzer/AnalysisInteraction";
import { AnalysisHistory } from "@/components/analyzer/AnalysisHistory";
import { Card, CardContent } from "@/components/ui/card";

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
        {/* The CardHeader that previously held the "Analysis History" title is removed. */}
        {/* The AnalysisHistory component will now render its own header. */}
        <CardContent>
          <AnalysisHistory userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
