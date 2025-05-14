
"use client"; 

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client"; 
import type { Database } from "@/lib/database.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, History, Clock, Edit3, Trash2, Loader2, Star, Filter, Share2, Copy, Save, StickyNote, RefreshCw } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { deleteAnalysisHistoryItem, toggleFavoriteStatus, updateUserNotes } from "@/app/actions";
import { EditAnalysisFormDialog } from "./EditAnalysisFormDialog"; 
import { PROGRAMMING_LANGUAGES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";


type AnalysisHistoryItem = Database["public"]["Tables"]["analysis_history"]["Row"];

interface AnalysisHistoryProps {
  userId: string;
}

const ALL_LANGUAGES_FILTER_VALUE = "all_languages_filter_option";

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
  const [selectedLanguage, setSelectedLanguage] = useState<string>(ALL_LANGUAGES_FILTER_VALUE);


  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [currentNotesText, setCurrentNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);


  const { toast } = useToast();
  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    console.log(`Fetching history for user ${userId}...`);
    const { data, error: dbError } = await supabase
      .from("analysis_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50); 

    if (dbError) {
      console.error("Error fetching initial history:", dbError);
      setError(dbError.message);
      setHistory([]);
    } else {
      console.log('History fetched successfully:', data ? data.length : 0, 'items');
      setHistory(data || []);
      setError(null);
    }
    setIsLoading(false);
  }, [supabase, userId]);


  useEffect(() => {
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
              console.log('Real-time INSERT received, new item (title, id, created_at, is_favorite, improvement_suggestions):', { 
                title: newItem.title, 
                id: newItem.id, 
                created_at: newItem.created_at, 
                is_favorite: newItem.is_favorite,
                improvement_suggestions: newItem.improvement_suggestions,
              });
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
                console.log('History state updated with new item. New history length:', finalHistory.length, 'First item:', finalHistory[0]?.title, 'Full new history:', finalHistory.map(i => ({id: i.id, title: i.title, created_at: i.created_at })));
                return finalHistory;
              });
              break;
            case 'UPDATE':
              const updatedItem = payload.new as AnalysisHistoryItem;
              console.log('Real-time UPDATE received, updated item (title, id, is_favorite, user_notes, improvement_suggestions):', { 
                title: updatedItem.title, 
                id: updatedItem.id, 
                is_favorite: updatedItem.is_favorite, 
                user_notes: updatedItem.user_notes,
                improvement_suggestions: updatedItem.improvement_suggestions,
              });
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
  }, [userId, supabase, fetchHistory]); 

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
    }
  };
  
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const languageMatch = !selectedLanguage || selectedLanguage === ALL_LANGUAGES_FILTER_VALUE || item.language === selectedLanguage;
      return languageMatch;
    });
  }, [history, selectedLanguage]);

  const handleEditNotes = (item: AnalysisHistoryItem) => {
    setEditingNotesId(item.id);
    setCurrentNotesText(item.user_notes || "");
  };

  const handleSaveNotes = async (itemId: string) => {
    setIsSavingNotes(true);
    const result = await updateUserNotes(itemId, currentNotesText);
    setIsSavingNotes(false);
    if (result.error) {
      toast({
        title: "Error Saving Notes",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Notes Saved",
        description: "Your notes have been updated.",
      });
      setEditingNotesId(null);
      // History will update via real-time subscription
    }
  };

  const handleCopyLink = (analysisId: string) => {
    const link = `${window.location.origin}/share/${analysisId}`;
    navigator.clipboard.writeText(link).then(() => {
      toast({ title: "Link Copied!", description: "Shareable link copied to clipboard." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy link.", variant: "destructive" });
      console.error('Failed to copy link: ', err);
    });
  };

  const handleRefreshHistory = () => {
    fetchHistory();
     toast({
      title: "History Refreshing",
      description: "Fetching the latest analysis history.",
    });
  };

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
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <h2 className="text-2xl font-semibold text-foreground">Analysis History</h2>
        <div className="flex items-center gap-2">
          <div className="min-w-[180px]">
            <Label htmlFor="language-filter" className="sr-only">Filter by Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger id="language-filter" className="w-full h-9">
                <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ALL_LANGUAGES_FILTER_VALUE}>All Languages</SelectItem>
                {PROGRAMMING_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefreshHistory} 
            disabled={isLoading}
            aria-label="Refresh history"
            className="shrink-0 h-9 w-9"
          >
            {isLoading && togglingFavoriteId === null ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
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
                  className="flex-1 p-0 hover:no-underline mr-2" 
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
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Share analysis">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="flex items-center space-x-2">
                        <Input 
                          readOnly 
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${item.id}`} 
                          className="h-8 text-xs"
                        />
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleCopyLink(item.id)}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
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
                  userNotes={item.user_notes} 
                />
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h5 className="font-semibold text-md flex items-center">
                    <StickyNote className="mr-2 h-5 w-5 text-primary" /> User Notes
                  </h5>
                  {editingNotesId === item.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={currentNotesText}
                        onChange={(e) => setCurrentNotesText(e.target.value)}
                        placeholder="Add your personal notes here..."
                        className="min-h-[100px]"
                        disabled={isSavingNotes}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingNotesId(null)}
                          disabled={isSavingNotes}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveNotes(item.id)}
                          disabled={isSavingNotes}
                        >
                          {isSavingNotes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {item.user_notes ? (
                        <p className="text-sm text-foreground/90 whitespace-pre-line">{item.user_notes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No notes added yet.</p>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => handleEditNotes(item)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" /> Edit Notes
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

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

      <EditAnalysisFormDialog 
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={itemToEdit}
      />
    </>
  );
}
    
