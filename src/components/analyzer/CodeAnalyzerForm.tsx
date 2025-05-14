
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { analyzeAndSaveCode } from "@/app/actions";
import { PROGRAMMING_LANGUAGES } from "@/lib/constants";
import type { AnalyzeCodeComplexityOutput } from "@/ai/flows/analyze-code-complexity";
import { AnalysisResultCard } from "./AnalysisResultCard";
import { Loader2, Wand2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().max(100, "Title can be at most 100 characters.").optional(),
  language: z.string().min(1, { message: "Please select a language." }),
  code: z
    .string()
    .min(10, { message: "Code must be at least 10 characters." })
    .max(5000, { message: "Code cannot exceed 5000 characters." }),
});

type CodeAnalyzerFormValues = z.infer<typeof formSchema>;

export function CodeAnalyzerForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<AnalyzeCodeComplexityOutput | null>(null);

  const form = useForm<CodeAnalyzerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      language: "",
      code: "",
    },
  });

  async function onSubmit(values: CodeAnalyzerFormValues) {
    setIsLoading(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append("title", values.title || `Analysis for ${values.language}`);
    formData.append("language", values.language);
    formData.append("code", values.code);

    try {
      const result = await analyzeAndSaveCode(formData);
      if (result.error) {
        toast({
          title: "Analysis Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        setAnalysisResult(result.data);
        toast({
          title: "Analysis Complete",
          description: "Code complexity has been analyzed.",
        });
        // Optionally refresh history if it's a client component or via router.refresh() for server component.
        // For now, history is a separate server component, so it will re-fetch on next navigation or full page refresh.
        // To force refresh of history, we'd need to use router.refresh() here.
        // import { useRouter } from 'next/navigation';
        // const router = useRouter(); router.refresh();
      }
    } catch (e: any) {
      toast({
        title: "An Unexpected Error Occurred",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., My Sorting Algorithm"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  A descriptive title for your code snippet.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programming Language</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Snippet</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your code here..."
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Paste the code you want to analyze. Max 5000 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Analyze Complexity
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="mt-6 flex items-center justify-center rounded-md border border-dashed p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Analyzing your code...</p>
        </div>
      )}

      {analysisResult && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Analysis Result</h3>
          <AnalysisResultCard result={analysisResult} />
        </div>
      )}
    </div>
  );
}