
"use client";

import { useState } from "react";
import type { AnalyzeCodeComplexityOutput } from "@/ai/flows/analyze-code-complexity";
import { CodeAnalyzerForm } from "./CodeAnalyzerForm";
import { AnalysisResultCard } from "./AnalysisResultCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

export function AnalysisInteraction() {
  const [currentAnalysisResult, setCurrentAnalysisResult] =
    useState<AnalyzeCodeComplexityOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [codeContext, setCodeContext] = useState<{
    title?: string;
    language?: string;
    code?: string;
  } | null>(null);

  const handleAnalysisStart = (data: {
    title?: string;
    language: string;
    code: string;
  }) => {
    setIsLoadingAnalysis(true);
    setCurrentAnalysisResult(null); // Clear previous result
    setCodeContext(data);
  };

  const handleAnalysisComplete = (
    result: AnalyzeCodeComplexityOutput | null
  ) => {
    setCurrentAnalysisResult(result);
    setIsLoadingAnalysis(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Analyze Code Snippet</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeAnalyzerForm
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Current Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px] pr-3"> {/* Adjusted height */}
            {isLoadingAnalysis && (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 min-h-[200px] h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-muted-foreground">Analyzing your code...</p>
              </div>
            )}
            {!isLoadingAnalysis && !currentAnalysisResult && (
               <div className="flex items-center justify-center rounded-md border border-dashed p-8 min-h-[200px] h-full">
                <p className="text-center text-muted-foreground">
                  The explanation for your code analysis will appear here once you submit a snippet.
                </p>
              </div>
            )}
            {!isLoadingAnalysis && currentAnalysisResult && (
              <AnalysisResultCard
                result={currentAnalysisResult}
                title={codeContext?.title}
                language={codeContext?.language}
                codeSnippet={codeContext?.code}
              />
            )}
             {!isLoadingAnalysis && !currentAnalysisResult && codeContext && (
                // This case can happen if analysis fails after starting
                <div className="flex items-center justify-center rounded-md border border-dashed p-8 min-h-[200px] h-full">
                  <p className="text-center text-muted-foreground">
                    Analysis failed or no result was returned. Please try again.
                  </p>
                </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
