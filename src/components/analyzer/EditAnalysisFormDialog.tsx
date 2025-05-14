
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import { useState, useEffect } from "react";
import { updateAnalysisHistoryItem } from "@/app/actions";
import { PROGRAMMING_LANGUAGES } from "@/lib/constants";
import { Loader2, Save } from "lucide-react";
import type { Database } from "@/lib/database.types";

type AnalysisHistoryItem = Database["public"]["Tables"]["analysis_history"]["Row"];

const formSchema = z.object({
  title: z.string().max(100, "Title can be at most 100 characters.").optional(),
  language: z.string().min(1, { message: "Please select a language." }),
  code: z
    .string()
    .min(10, { message: "Code must be at least 10 characters." })
    .max(5000, { message: "Code cannot exceed 5000 characters." }),
});

type EditAnalysisFormValues = z.infer<typeof formSchema>;

interface EditAnalysisFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: AnalysisHistoryItem | null;
}

export function EditAnalysisFormDialog({
  isOpen,
  onOpenChange,
  item,
}: EditAnalysisFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EditAnalysisFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      language: "",
      code: "",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        title: item.title || "",
        language: item.language,
        code: item.code_snippet,
      });
    }
  }, [item, form, isOpen]); // Reset form when item changes or dialog opens

  async function onSubmit(values: EditAnalysisFormValues) {
    if (!item) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("title", values.title || `Analysis for ${values.language}`);
    formData.append("language", values.language);
    formData.append("code", values.code);

    try {
      const result = await updateAnalysisHistoryItem(item.id, formData);
      if (result.error) {
        toast({
          title: "Update Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Update Successful",
          description: "Analysis history item has been updated.",
        });
        onOpenChange(false); // Close dialog on success
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

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Analysis</DialogTitle>
          <DialogDescription>
            Modify the details of your saved code analysis.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
                    value={field.value} // Ensure value is controlled
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
                      className="min-h-[150px] font-mono text-sm"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The code snippet that was analyzed. Max 5000 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
