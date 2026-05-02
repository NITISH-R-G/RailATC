import { useListConflicts, useResolveConflict, getListConflictsQueryKey, getGetKpisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertTriangle, ShieldAlert, CheckCircle2, Bot } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const resolveSchema = z.object({
  resolution: z.string().min(5, "Please provide a detailed resolution"),
  resolvedBy: z.string().min(1, "Required")
});

type ResolveFormValues = z.infer<typeof resolveSchema>;

export default function Conflicts() {
  const { data: conflicts, isLoading } = useListConflicts();
  const resolveMutation = useResolveConflict();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedConflict, setSelectedConflict] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ResolveFormValues>({
    resolver: zodResolver(resolveSchema),
    defaultValues: {
      resolution: "",
      resolvedBy: "Controller (Current Session)"
    }
  });

  const activeConflicts = conflicts?.filter(c => c.status === 'active') || [];
  const resolvedConflicts = conflicts?.filter(c => c.status === 'resolved') || [];

  const openResolveDialog = (id: number, suggestion: string) => {
    setSelectedConflict(id);
    form.reset({
      resolution: suggestion || "",
      resolvedBy: "Controller (Current Session)"
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: ResolveFormValues) => {
    if (!selectedConflict) return;
    
    resolveMutation.mutate(
      { id: selectedConflict, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConflictsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetKpisQueryKey() });
          setDialogOpen(false);
          toast({
            title: "Conflict Resolved",
            description: "The conflict has been marked as resolved.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Resolution Failed",
            description: "Could not resolve the conflict.",
          });
        }
      }
    );
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Conflict Detection</h1>
        <Badge variant="destructive" className="text-sm px-3 py-1">
          {activeConflicts.length} Active Conflicts
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Action Required
          </h2>
          
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
          ) : activeConflicts.length === 0 ? (
            <Card className="bg-card border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-4 text-green-500/50" />
                <p>No active conflicts detected on the network.</p>
              </CardContent>
            </Card>
          ) : (
            activeConflicts.map(conflict => (
              <Card key={conflict.id} className={`bg-card border-l-4 ${
                conflict.severity === 'critical' ? 'border-l-destructive' : 
                conflict.severity === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'
              }`}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      {getSeverityIcon(conflict.severity)}
                      <div>
                        <h3 className="font-bold text-lg leading-none capitalize">
                          {conflict.type.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Section: {conflict.sectionName}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(conflict.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="outline" className="font-mono text-sm">Train {conflict.trainANumber}</Badge>
                    {conflict.trainBNumber && (
                      <>
                        <span className="text-muted-foreground text-sm flex items-center">vs</span>
                        <Badge variant="outline" className="font-mono text-sm">Train {conflict.trainBNumber}</Badge>
                      </>
                    )}
                  </div>

                  <div className="bg-sidebar rounded-md p-3 border border-border">
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                      <Bot className="h-4 w-4" /> AI Suggestion
                    </div>
                    <p className="text-sm">{conflict.aiSuggestion}</p>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => openResolveDialog(conflict.id, conflict.aiSuggestion)}>
                      Resolve Conflict
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5" />
            Recently Resolved
          </h2>

          {isLoading ? (
            Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : resolvedConflicts.slice(0, 5).map(conflict => (
            <Card key={conflict.id} className="bg-card opacity-70 hover:opacity-100 transition-opacity">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-sm capitalize">{conflict.type.replace('_', ' ')}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {conflict.resolvedAt && new Date(conflict.resolvedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Train {conflict.trainANumber} {conflict.trainBNumber ? `and ${conflict.trainBNumber}` : ''} at {conflict.sectionName}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Conflict</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="resolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Details</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe action taken..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resolvedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Controller ID</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={resolveMutation.isPending}>
                  {resolveMutation.isPending ? "Resolving..." : "Confirm Resolution"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
