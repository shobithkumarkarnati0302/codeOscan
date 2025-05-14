
"use client"; // Required for useState, useEffect, and event handlers

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Use client for client-side fetching initially
import type { Database } from "@/lib/database.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, History, Clock, Edit3, Trash2, Loader2 } from "lucide-react";
import { AnalysisResultCard } from "./AnalysisResultCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteAnalysisHistoryItem } from "@/app/actions";
import { EditAnalysisFormDialog } from "./EditAnalysisFormDialog"; // New component

type AnalysisHistoryItem = Database["public"]["Tables"]["analysis_history"]["Row"];

interface AnalysisHistoryProps {
  userId: string;
}

export function AnalysisHistory({ userId }: AnalysisHistoryProps) {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AnalysisHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<AnalysisHistoryItem | null>(null);

  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      const { data, error: dbError } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20); // Increased limit slightly

      if (dbError) {
        setError(dbError.message);
        setHistory([]);
      } else {
        setHistory(data || []);
        setError(null);
      }
      setIsLoading(false);
    }

    fetchHistory();

    // Listen for real-time changes (inserts, updates, deletes)
    const channel = supabase
      .channel(`analysis_history_changes_for_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'analysis_history', filter: `user_id=eq.${userId}` },
        (payload) => {
          // Refetch history on any change
          // console.log('Change received!', payload)
          fetchHistory(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleDeleteRequest = (item: AnalysisHistoryItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const result = await deleteAnalysisHistoryItem(itemToDelete.id);
    setIsDeleting(false);
    setShowDeleteDialog(false);

    if (result.error) {
      toast({
        title: "Deletion Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deletion Successful",
        description: "The analysis history item has been deleted.",
      });
      // History will be refetched by the realtime subscription or can be manually refetched here
      // setHistory(prev => prev.filter(h => h.id !== itemToDelete.id)); 
    }
    setItemToDelete(null);
  };

  const handleEditRequest = (item: AnalysisHistoryItem) => {
    setItemToEdit(item);
    setShowEditDialog(true);
  };


  if (isLoading && history.length === 0) { // Show loader only on initial load
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md flex items-center">
        <AlertCircle className="mr-2 h-5 w-5" /> Error fetching history: {error}
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
    <>
      <ScrollArea className="h-[600px] pr-4">
        <Accordion type="single" collapsible className="w-full space-y-3">
          {history.map((item) => (
            <AccordionItem value={item.id} key={item.id} className="border bg-card rounded-lg shadow-sm">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-t-lg">
                <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                  <div className="flex flex-col items-start text-left w-full">
                    <h3 className="text-md font-semibold text-primary">
                      {item.title || "Untitled Analysis"}
                    </h3>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="mr-2">{item.language}</Badge>
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center space-x-2 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEditRequest(item)}
                    aria-label="Edit item"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteRequest(item)}
                    aria-label="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <AccordionContent className="p-4 pt-0 border-t">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              analysis history item titled &quot;{itemToDelete?.title || "Untitled Analysis"}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <EditAnalysisFormDialog 
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={itemToEdit}
      />
    </>
  );
}

