
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
import { validateCodeLanguage, type ValidateCodeLanguageInput, type ValidateCodeLanguageOutput } from "@/ai/flows/validate-code-language";
import { PROGRAMMING_LANGUAGES, EXPLANATION_LEVELS } from "@/lib/constants";
import type { AnalyzeCodeComplexityOutput } from "@/ai/flows/analyze-code-complexity";
import { Loader2, Wand2, ShieldAlert } from "lucide-react";

const formSchema = z.object({
  title: z.string().max(100, "Title can be at most 100 characters.").optional(),
  language: z.string().min(1, { message: "Please select a language." }),
  explanationLevel: z.string().optional(),
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
    explanationLevel?: string;
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
  const [isValidatingLanguage, setIsValidatingLanguage] = useState(false);

  const form = useForm<CodeAnalyzerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      language: "",
      explanationLevel: "Intermediate", // Default explanation level
      code: "",
    },
  });

  async function onSubmit(values: CodeAnalyzerFormValues) {
    setIsValidatingLanguage(true);
    onAnalysisStart({ // Indicate general loading process has started
      title: values.title,
      language: values.language,
      explanationLevel: values.explanationLevel,
      code: values.code,
    });
    
    try {
      const languageValidationInput: ValidateCodeLanguageInput = {
        expectedLanguage: values.language,
        code: values.code,
      };
      const languageValidationResult: ValidateCodeLanguageOutput = await validateCodeLanguage(languageValidationInput);

      if (!languageValidationResult.isValid) {
        toast({
          title: "Language Mismatch",
          description: `${languageValidationResult.reasoning} (AI suggests this might be ${languageValidationResult.detectedLanguage || 'an unexpected language'}). Please select the correct language or revise your code.`,
          variant: "destructive",
          duration: 7000,
        });
        onAnalysisComplete(null); // Clear any previous analysis result and stop loading spinner
        setIsValidatingLanguage(false);
        setIsLoading(false); // Also set main loading to false
        return;
      }
      toast({
          title: "Language Validated",
          description: `AI confirmed the code appears to be ${values.language}. Proceeding with complexity analysis.`,
          duration: 3000,
      });

    } catch (langError: any) {
      toast({
        title: "Language Validation Error",
        description: langError.message || "Could not validate code language. Proceeding with analysis, but results might be affected.",
        variant: "destructive",
      });
      // Optionally, you might decide to stop here or proceed with caution
      // For now, we'll log and let it proceed to complexity analysis if user wants
    } finally {
      setIsValidatingLanguage(false);
    }

    setIsLoading(true); // Ensure isLoading is true for complexity analysis part
    // onAnalysisStart was already called

    const formData = new FormData();
    formData.append("title", values.title || `Analysis for ${values.language}`);
    formData.append("language", values.language);
    formData.append("code", values.code);
    if (values.explanationLevel) {
      formData.append("explanationLevel", values.explanationLevel);
    }

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

  const totalLoading = isLoading || isValidatingLanguage;

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
                  disabled={totalLoading}
                />
              </FormControl>
              <FormDescription>
                A descriptive title for your code snippet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programming Language</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={totalLoading}
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
            name="explanationLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Explanation Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={totalLoading}
                  defaultValue="Intermediate"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select explanation level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EXPLANATION_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  disabled={totalLoading}
                />
              </FormControl>
              <FormDescription>
                Paste the code you want to analyze. Max 5000 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={totalLoading}>
          {isValidatingLanguage ? (
            <ShieldAlert className="mr-2 h-4 w-4 animate-pulse" />
          ) : isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {isValidatingLanguage ? "Validating Language..." : "Analyze Complexity"}
        </Button>
      </form>
    </Form>
  );
}
