
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CodeAnalyzerForm } from "@/components/analyzer/CodeAnalyzerForm";
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
    <div className="container mx-auto py-8 px-4">
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Analyze Code Snippet</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeAnalyzerForm />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="shadow-lg h-full">
             <CardHeader>
              <CardTitle className="text-2xl">Analysis History</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisHistory userId={user.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}