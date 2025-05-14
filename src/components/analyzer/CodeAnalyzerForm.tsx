
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

interface CodeAnalyzerFormProps {
  onAnalysisStart: (data: {
    title?: string;
    language: string;
    code: string;
  }) => void;
  onAnalysisComplete: (result: AnalyzeCodeComplexityOutput | null) => void;
}

export function CodeAnalyzerForm({
  onAnalysisStart,
  onAnalysisComplete,
}: CodeAnalyzerFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CodeAnalyzerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      language: "",
      code: "",
    },
    // Reset form on successful submission or clear if needed.
    // For now, let's keep the values.
  });

  async function onSubmit(values: CodeAnalyzerFormValues) {
    setIsLoading(true);
    onAnalysisStart({
      title: values.title,
      language: values.language,
      code: values.code,
    });

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
        onAnalysisComplete(null);
      } else if (result.data) {
        onAnalysisComplete(result.data);
        toast({
          title: "Analysis Complete",
          description: "Code complexity has been analyzed and saved.",
        });
      } else {
        // Should not happen if API returns data or error consistently
        onAnalysisComplete(null);
      }
    } catch (e: any) {
      toast({
        title: "An Unexpected Error Occurred",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
      onAnalysisComplete(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
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
                value={field.value} // Ensure value is controlled for reset
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
  );
}
