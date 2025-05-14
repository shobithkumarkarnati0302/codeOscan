
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAnalysisByIdForSharing } from '@/app/actions';
import type { Database } from '@/lib/database.types';
import { AnalysisResultCard } from '@/components/analyzer/AnalysisResultCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type AnalysisHistoryItem = Database["public"]["Tables"]["analysis_history"]["Row"];

export default function ShareAnalysisPage() {
  const params = useParams();
  const analysisId = params.analysisId as string;

  const [analysisItem, setAnalysisItem] = useState<AnalysisHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (analysisId) {
      setIsLoading(true);
      getAnalysisByIdForSharing(analysisId)
        .then(response => {
          if (response.error) {
            setError(response.error);
            setAnalysisItem(null);
          } else if (response.data) {
            setAnalysisItem(response.data);
            setError(null);
          } else {
            setError("Analysis not found or not accessible.");
            setAnalysisItem(null);
          }
        })
        .catch(err => {
          console.error("Error fetching shared analysis:", err);
          setError("An unexpected error occurred while fetching the analysis.");
          setAnalysisItem(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setError("No Analysis ID provided.");
      setIsLoading(false);
    }
  }, [analysisId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied or Analysis Not Found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
         <p className="text-xs text-muted-foreground mt-8 max-w-lg">
          Note: If this is a private analysis, you might need to be logged in to view it, 
          or the owner may need to mark it as public (if that feature is available).
          Ensure your Supabase Row Level Security (RLS) policies for the 'analysis_history' table allow anonymous reads for publicly shared items.
        </p>
      </div>
    );
  }

  if (!analysisItem) {
    // This case should ideally be caught by error handling but serves as a fallback.
    return (
      <div className="container mx-auto py-10 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-muted-foreground">Analysis not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Shared Code Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisResultCard
            result={{
              timeComplexity: analysisItem.time_complexity || "N/A",
              spaceComplexity: analysisItem.space_complexity || "N/A",
              explanation: analysisItem.explanation || "No explanation provided.",
              improvementSuggestions: analysisItem.improvement_suggestions || undefined,
            }}
            title={analysisItem.title || "Untitled Analysis"}
            language={analysisItem.language}
            codeSnippet={analysisItem.code_snippet}
            createdAt={analysisItem.created_at}
            userNotes={analysisItem.user_notes}
          />
        </CardContent>
      </Card>
       <div className="text-center mt-8">
        <Button asChild variant="outline">
          <Link href="/">Back to CodeOscan Home</Link>
        </Button>
      </div>
    </div>
  );
}
