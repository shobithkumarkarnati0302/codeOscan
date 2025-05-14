
import type { AnalyzeCodeComplexityOutput } from "@/ai/flows/analyze-code-complexity";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Clock, DatabaseZap, Info } from "lucide-react"; // Using DatabaseZap for space complexity

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
      <CardContent className="space-y-4">
        {codeSnippet && (
          <>
            <div>
              <h4 className="font-semibold text-sm mb-1 flex items-center"><Info className="mr-2 h-4 w-4 text-primary" /> Code Snippet:</h4>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-40">
                <code>{codeSnippet}</code>
              </pre>
            </div>
            <Separator />
          </>
        )}
        <div>
          <h4 className="font-semibold text-md mb-2 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-primary" /> Explanation
          </h4>
          <p className="text-sm text-foreground/90">{result.explanation}</p>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-md mb-2 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" /> Time Complexity
            </h4>
            <p className="text-sm font-mono bg-muted px-2 py-1 rounded-md inline-block">
              {result.timeComplexity}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-md mb-2 flex items-center">
              <DatabaseZap className="mr-2 h-5 w-5 text-primary" /> Space Complexity
            </h4>
            <p className="text-sm font-mono bg-muted px-2 py-1 rounded-md inline-block">
              {result.spaceComplexity}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}