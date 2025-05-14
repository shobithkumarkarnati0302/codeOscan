
import type { AnalyzeCodeComplexityOutput } from "@/ai/flows/analyze-code-complexity";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Clock, DatabaseZap, Info, Sparkles } from "lucide-react"; // Using DatabaseZap for space, Sparkles for suggestions

interface AnalysisResultCardProps {
  result: AnalyzeCodeComplexityOutput;
  title?: string;
  language?: string;
  codeSnippet?: string;
  createdAt?: string;
}

export function AnalysisResultCard({
  result,
  title,
  language,
  codeSnippet,
  createdAt,
}: AnalysisResultCardProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        {title && <CardTitle className="text-xl">{title}</CardTitle>}
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {language && <Badge variant="secondary">{language}</Badge>}
          {createdAt && (
            <span className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {new Date(createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6"> {/* Increased spacing */}
        {codeSnippet && (
          <>
            <div>
              <h4 className="font-semibold text-md mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> Code Snippet:</h4>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-40 font-mono">
                <code>{codeSnippet}</code>
              </pre>
            </div>
            <Separator />
          </>
        )}
        
        <div className="space-y-3">
          <h4 className="font-semibold text-lg mb-2 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-primary" /> Analysis Details
          </h4>
          <div className="pl-2">
            <p className="text-sm text-foreground/90">{result.explanation}</p>
          </div>
        </div>
        
        <Separator />

        <div className="space-y-4">
           <h4 className="font-semibold text-lg mb-3 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" /> Complexity Breakdown
          </h4>
          <div className="pl-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-md">
              <h5 className="font-medium text-md mb-1">Time Complexity</h5>
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded-md inline-block">
                {result.timeComplexity}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-md">
              <h5 className="font-medium text-md mb-1">Space Complexity</h5>
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded-md inline-block">
                {result.spaceComplexity}
              </p>
            </div>
          </div>
        </div>

        {result.improvementSuggestions && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold text-lg mb-2 flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-primary" /> Improvement Suggestions
              </h4>
              <div className="pl-2">
                <p className="text-sm text-foreground/90 whitespace-pre-line">{result.improvementSuggestions}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
