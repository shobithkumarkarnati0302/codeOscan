
import { createClient } from "@/lib/supabase/server";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, History, Clock } from "lucide-react";
import Link from "next/link";
import { AnalysisResultCard } from "./AnalysisResultCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


interface AnalysisHistoryProps {
  userId: string;
}

export async function AnalysisHistory({ userId }: AnalysisHistoryProps) {
  const supabase = createClient();
  const { data: history, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md flex items-center">
        <AlertCircle className="mr-2 h-5 w-5" /> Error fetching history: {error.message}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-6 border border-dashed rounded-md">
        <History className="mx-auto h-12 w-12 mb-4" />
        <p className="font-semibold">No Analysis History</p>
        <p className="text-sm">
          Perform an analysis to see your history here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4"> {/* Adjust height as needed */}
      <Accordion type="single" collapsible className="w-full space-y-3">
        {history.map((item) => (
          <AccordionItem value={item.id} key={item.id} className="border bg-card rounded-lg shadow-sm">
            <AccordionTrigger className="p-4 hover:no-underline">
              <div className="flex flex-col items-start text-left w-full">
                <h3 className="text-md font-semibold text-primary truncate max-w-[90%]">
                  {item.title || "Untitled Analysis"}
                </h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="mr-2">{item.language}</Badge>
                  <Clock className="mr-1 h-3 w-3" />
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
               <AnalysisResultCard 
                result={{
                  timeComplexity: item.time_complexity || "N/A",
                  spaceComplexity: item.space_complexity || "N/A",
                  explanation: item.explanation || "No explanation provided.",
                }}
                codeSnippet={item.code_snippet}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
}