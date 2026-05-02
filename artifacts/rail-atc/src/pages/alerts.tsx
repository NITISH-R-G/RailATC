import { useListAlerts, useAcknowledgeAlert, getListAlertsQueryKey, getGetKpisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Alerts() {
  const { data: alerts, isLoading } = useListAlerts();
  const ackMutation = useAcknowledgeAlert();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAcknowledge = (id: number) => {
    ackMutation.mutate(
      { id, data: { status: "acknowledged" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetKpisQueryKey() });
          toast({ title: "Alert Acknowledged" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to acknowledge alert" });
        }
      }
    );
  };

  const getIcon = (severity: string) => {
    if (severity === 'critical') return <ShieldAlert className="h-6 w-6 text-destructive shrink-0 mt-1" />;
    if (severity === 'warning') return <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0 mt-1" />;
    return <Info className="h-6 w-6 text-blue-500 shrink-0 mt-1" />;
  };

  const activeAlerts = alerts?.filter(a => a.status === 'active') || [];
  const historicalAlerts = alerts?.filter(a => a.status !== 'active') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Network Alerts</h1>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
          Active Alerts ({activeAlerts.length})
        </h2>
        
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : activeAlerts.length === 0 ? (
          <Card className="bg-card border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mb-2 text-green-500/50" />
              <p>No active network alerts.</p>
            </CardContent>
          </Card>
        ) : (
          activeAlerts.map(alert => (
            <Card key={alert.id} className={`bg-card border-l-4 ${
              alert.severity === 'critical' ? 'border-l-destructive' : 
              alert.severity === 'warning' ? 'border-l-orange-500' : 'border-l-blue-500'
            }`}>
              <CardContent className="p-4 flex items-start gap-4">
                {getIcon(alert.severity)}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{alert.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="capitalize text-xs">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                        {alert.trainNumber && <Badge variant="secondary" className="text-xs font-mono">Train {alert.trainNumber}</Badge>}
                        {alert.sectionName && <Badge variant="secondary" className="text-xs">{alert.sectionName}</Badge>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2">{alert.message}</p>
                </div>
                <div className="shrink-0 flex flex-col justify-center gap-2 self-stretch border-l pl-4 ml-2">
                  <Button 
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={ackMutation.isPending}
                  >
                    Acknowledge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4 pt-8">
        <h2 className="text-lg font-semibold text-muted-foreground">Historical Alerts</h2>
        <div className="grid gap-3">
          {historicalAlerts.slice(0, 10).map(alert => (
            <div key={alert.id} className="flex items-center justify-between p-3 rounded bg-card/50 border border-border">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${
                  alert.severity === 'critical' ? 'bg-destructive' : 
                  alert.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <span className="font-medium text-sm">{alert.title}</span>
                <span className="text-xs text-muted-foreground hidden md:inline-block">- {alert.message}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] uppercase bg-muted text-muted-foreground">
                  {alert.status}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(alert.createdAt).toLocaleDateString()} {new Date(alert.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
