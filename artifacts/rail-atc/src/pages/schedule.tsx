import { 
  useListSchedule, 
  useOverrideScheduleEntry, 
  useOptimizeSchedule,
  getListScheduleQueryKey,
  getGetKpisQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

const OVERRIDE_ACTIONS = ["hold", "proceed", "reroute"] as const;

const overrideSchema = z.object({
  action: z.enum(["hold", "proceed", "reroute"]),
  reason: z.string().min(1, "Reason is required"),
  newDepartureTime: z.string().optional()
});

type OverrideFormValues = z.infer<typeof overrideSchema>;

export default function Schedule() {
  const { data: schedule, isLoading } = useListSchedule();
  const overrideMutation = useOverrideScheduleEntry();
  const optimizeMutation = useOptimizeSchedule();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      action: "hold",
      reason: "",
      newDepartureTime: ""
    }
  });

  const handleOptimize = () => {
    optimizeMutation.mutate(undefined, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListScheduleQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetKpisQueryKey() });
        toast({
          title: "Schedule Optimized",
          description: `Resolved ${res.conflictsResolved} conflicts. Delay reduction: ${res.expectedDelayReductionMin}m`,
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Optimization Failed",
          description: "Could not complete AI schedule optimization.",
        });
      }
    });
  };

  const openOverrideDialog = (id: number) => {
    setSelectedEntry(id);
    form.reset({
      action: "hold",
      reason: "",
      newDepartureTime: ""
    });
    setDialogOpen(true);
  };

  const onSubmitOverride = (values: OverrideFormValues) => {
    if (!selectedEntry) return;
    
    const payload = {
      ...values,
      newDepartureTime: values.newDepartureTime ? new Date(values.newDepartureTime).toISOString() : undefined
    };

    overrideMutation.mutate(
      { id: selectedEntry, data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListScheduleQueryKey() });
          setDialogOpen(false);
          toast({
            title: "Override Applied",
            description: "Schedule entry has been updated manually.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Override Failed",
            description: "Could not apply manual override.",
          });
        }
      }
    );
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Schedule Master</h1>
        <Button onClick={handleOptimize} disabled={optimizeMutation.isPending} className="gap-2">
          {optimizeMutation.isPending ? <Sparkles className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          Run AI Optimizer
        </Button>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Upcoming Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Train</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Planned Arr</TableHead>
                <TableHead>Planned Dep</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>AI Recommendation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : schedule?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No scheduled entries found
                  </TableCell>
                </TableRow>
              ) : schedule?.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono font-medium">{entry.trainNumber}</TableCell>
                  <TableCell>{entry.sectionName}</TableCell>
                  <TableCell>{formatTime(entry.plannedArrival)}</TableCell>
                  <TableCell>{formatTime(entry.plannedDeparture)}</TableCell>
                  <TableCell>
                    <Badge variant={entry.status === 'scheduled' ? 'outline' : entry.status === 'completed' ? 'secondary' : 'default'} className={
                      entry.status === 'overridden' ? 'bg-orange-500 text-white' : ''
                    }>
                      {entry.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.aiRecommendation ? (
                      <div className="flex items-center gap-1.5 text-sm text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        {entry.aiRecommendation}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openOverrideDialog(entry.id)}>
                      Override
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Schedule Override</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitOverride)} className="space-y-4">
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OVERRIDE_ACTIONS.map((action) => (
                          <SelectItem key={action} value={action}>
                            {action.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newDepartureTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Departure Time (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Override</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Signal failure ahead" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={overrideMutation.isPending} variant="destructive">
                  {overrideMutation.isPending ? "Applying..." : "Apply Override"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
