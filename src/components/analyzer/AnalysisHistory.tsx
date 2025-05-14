
"use client"; 

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client"; 
import type { Database } from "@/lib/database.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, History, Clock, Edit3, Trash2, Loader2, Star, Filter } from "lucide-react";
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
import { deleteAnalysisHistoryItem, toggleFavoriteStatus } from "@/app/actions";
import { EditAnalysisFormDialog } from "./EditAnalysisFormDialog"; 
import { PROGRAMMING_LANGUAGES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


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
  
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");


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
        .limit(50); // Increased limit slightly for more history items

      if (dbError) {
        console.error("Error fetching initial history:", dbError);
        setError(dbError.message);
        setHistory([]);
      } else {
        setHistory(data || []);
        setError(null);
      }
      setIsLoading(false);
    }

    fetchHistory();

    const channel = supabase
      .channel(`analysis_history_changes_for_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'analysis_history', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Supabase real-time event received:', payload.eventType, payload);
          switch (payload.eventType) {
            case 'INSERT':
              const newItem = payload.new as AnalysisHistoryItem;
              console.log('Real-time INSERT received, new item (title, id, created_at, is_favorite):', { title: newItem.title, id: newItem.id, created_at: newItem.created_at, is_favorite: newItem.is_favorite });
              setHistory(prevHistory => {
                console.log('Previous history length before INSERT:', prevHistory.length);
                if (prevHistory.some(item => item.id === newItem.id)) {
                  console.log('New item ID already exists in history, not adding duplicate:', newItem.id);
                  return prevHistory;
                }
                const updatedHistory = [newItem, ...prevHistory];
                updatedHistory.sort((a, b) => {
                  const timeA = a.created_at ? new Date(a.created_at).getTime() : NaN;
                  const timeB = b.created_at ? new Date(b.created_at).getTime() : NaN;
                  if (isNaN(timeA) && isNaN(timeB)) return 0;
                  if (isNaN(timeA)) return 1; 
                  if (isNaN(timeB)) return -1;
                  return timeB - timeA; 
                });
                const finalHistory = updatedHistory.slice(0, 50); 
                console.log('History state updated with new item. New history length:', finalHistory.length, 'First item:', finalHistory[0]?.title);
                return finalHistory;
              });
              break;
            case 'UPDATE':
              const updatedItem = payload.new as AnalysisHistoryItem;
              console.log('Real-time UPDATE received, updated item (title, id, is_favorite):', { title: updatedItem.title, id: updatedItem.id, is_favorite: updatedItem.is_favorite });
              setHistory(prevHistory => {
                const newHistory = prevHistory.map(item => item.id === updatedItem.id ? updatedItem : item);
                newHistory.sort((a,b) => {
                  const timeA = a.created_at ? new Date(a.created_at).getTime() : NaN;
                  const timeB = b.created_at ? new Date(b.created_at).getTime() : NaN;
                  if (isNaN(timeA) && isNaN(timeB)) return 0;
                  if (isNaN(timeA)) return 1;
                  if (isNaN(timeB)) return -1;
                  return timeB - timeA;
                });
                return newHistory; 
              });
              break;
            case 'DELETE':
              const oldItemId = (payload.old as Partial<AnalysisHistoryItem>).id;
              console.log('Real-time DELETE received, old item ID:', oldItemId);
              if (oldItemId) {
                setHistory(prevHistory => prevHistory.filter(item => item.id !== oldItemId));
              } else {
                console.warn('Real-time DELETE event did not contain old item ID, refetching history.');
                fetchHistory(); 
              }
              break;
            default:
              console.log('Unhandled real-time event type or fallback, refetching history:', payload.eventType);
              fetchHistory();
          }
        }
      )
      .subscribe((status, error) => {
        console.log(`Supabase channel [analysis_history_changes_for_${userId}] subscription status: ${status}`);
        if (error) {
          console.error(`Supabase channel subscription error for user ${userId}:`, error);
          setError(`Failed to subscribe to real-time updates: ${error.message}. Try refreshing.`);
        }
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to real-time analysis history for user ${userId}.`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
           console.error(`Supabase channel status issue: ${status} for user ${userId}.`);
           setError(`Real-time connection issue: ${status}. History may not update automatically. Try refreshing.`);
        }
      });

    return () => {
      console.log(`Unsubscribing from Supabase channel for user ${userId}.`);
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
      setHistory(prev => prev.filter(h => h.id !== itemToDelete!.id)); 
    }
    setItemToDelete(null);
  };

  const handleEditRequest = (item: AnalysisHistoryItem) => {
    setItemToEdit(item);
    setShowEditDialog(true);
  };

  const handleToggleFavorite = async (item: AnalysisHistoryItem) => {
    setTogglingFavoriteId(item.id);
    const result = await toggleFavoriteStatus(item.id, !!item.is_favorite);
    setTogglingFavoriteId(null);

    if (result.error) {
      toast({
        title: "Favorite Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Favorite Updated",
        description: `Item ${item.is_favorite ? "unmarked" : "marked"} as favorite.`,
      });
      // UI update will be handled by real-time subscription
    }
  };
  
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const languageMatch = !selectedLanguage || item.language === selectedLanguage;
      // Add more filter conditions here in the future (e.g., date, search term)
      return languageMatch;
    });
  }, [history, selectedLanguage]);


  if (isLoading && history.length === 0) { 
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  if (error && history.length === 0) { 
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md flex items-center">
        <AlertCircle className="mr-2 h-5 w-5" /> Error fetching history: {error}
      </div>
    );
  }
  
  if (!isLoading && error && history.length > 0) { 
     toast({
        title: "Real-time Update Issue",
        description: error,
        variant: "destructive",
        duration: 10000, 
      });
  }


  if (!isLoading && history.length === 0 && !error) { 
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
      <div className="mb-6 p-4 border bg-card rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Filter History</h3>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Label htmlFor="language-filter" className="sr-only">Filter by Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger id="language-filter" className="w-full">
                    <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All Languages</SelectItem>
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        {filteredHistory.length === 0 && !isLoading && (
             <div className="text-center text-muted-foreground p-6 border border-dashed rounded-md">
                <p className="font-semibold">No matching history items.</p>
                <p className="text-sm">
                Try adjusting your filters or perform a new analysis.
                </p>
            </div>
        )}
        {filteredHistory.length === 0 && isLoading && ( 
            <div className="flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading history...</p>
            </div>
        )}
        <Accordion type="single" collapsible className="w-full space-y-3">
          {filteredHistory.map((item) => (
            <AccordionItem value={item.id} key={item.id} className="border bg-card rounded-lg shadow-sm group">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-t-lg">
                <AccordionTrigger 
                  iconPosition="start" 
                  className="flex-1 p-0 hover:no-underline mr-2" // Added margin-right
                >
                  <div className="flex flex-col items-start text-left w-full">
                    <h3 className="text-md font-semibold text-primary">
                      {item.title || "Untitled Analysis"}
                    </h3>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="mr-2">{item.language}</Badge>
                      <Clock className="mr-1 h-3 w-3" />
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date N/A'}
                    </div>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center space-x-1 ml-2">
                   <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleToggleFavorite(item)}
                    disabled={togglingFavoriteId === item.id}
                    aria-label={item.is_favorite ? "Unmark as favorite" : "Mark as favorite"}
                  >
                    {togglingFavoriteId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className={`h-4 w-4 ${item.is_favorite ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground"}`} />
                    )}
                  </Button>
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
                    improvementSuggestions: item.improvement_suggestions || undefined,
                  }}
                  codeSnippet={item.code_snippet}
                  title={item.title || undefined}
                  language={item.language}
                  createdAt={item.created_at}
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
    
