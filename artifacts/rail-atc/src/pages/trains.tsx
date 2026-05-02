import { useListTrains, useUpdateTrain, getListTrainsQueryKey, getGetKpisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const TRAIN_STATUSES = ["on_time", "delayed", "halted", "rerouted", "cancelled"] as const;

const updateSchema = z.object({
  status: z.enum(["on_time", "delayed", "halted", "rerouted", "cancelled"]),
  delayMinutes: z.coerce.number().min(0),
  speedKmh: z.coerce.number().min(0)
});

type UpdateFormValues = z.infer<typeof updateSchema>;

export default function Trains() {
  const { data: trains, isLoading } = useListTrains();
  const updateTrainMutation = useUpdateTrain();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTrain, setSelectedTrain] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: "on_time",
      delayMinutes: 0,
      speedKmh: 0
    }
  });

  const openUpdateDialog = (train: any) => {
    setSelectedTrain(train.id);
    form.reset({
      status: train.status,
      delayMinutes: train.delayMinutes,
      speedKmh: train.speedKmh
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: UpdateFormValues) => {
    if (!selectedTrain) return;
    
    updateTrainMutation.mutate(
      { id: selectedTrain, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTrainsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetKpisQueryKey() });
          setDialogOpen(false);
          toast({
            title: "Train updated",
            description: "Train status has been successfully updated.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update train status.",
          });
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_time": return <Badge className="bg-green-500 hover:bg-green-600">On Time</Badge>;
      case "delayed": return <Badge variant="destructive">Delayed</Badge>;
      case "halted": return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Halted</Badge>;
      case "rerouted": return <Badge className="bg-blue-500 hover:bg-blue-600">Rerouted</Badge>;
      case "cancelled": return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Trains Active Roster</h1>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>All Trains</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Train No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : trains?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No active trains found
                  </TableCell>
                </TableRow>
              ) : trains?.map(train => (
                <TableRow key={train.id}>
                  <TableCell className="font-mono font-medium">{train.trainNumber}</TableCell>
                  <TableCell className="capitalize">{train.type}</TableCell>
                  <TableCell>{train.origin} → {train.destination}</TableCell>
                  <TableCell>{getStatusBadge(train.status)}</TableCell>
                  <TableCell className={train.delayMinutes > 0 ? "text-destructive font-medium" : ""}>
                    {train.delayMinutes} min
                  </TableCell>
                  <TableCell>{train.speedKmh} km/h</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openUpdateDialog(train)}>
                      Update
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
            <DialogTitle>Update Train Status</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRAIN_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ").toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delayMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay (Minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="speedKmh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Speed (km/h)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateTrainMutation.isPending}>
                  {updateTrainMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
