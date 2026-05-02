import { 
  useGetKpis, 
  useGetKpiHistory, 
  useListAlerts,
  useListConflicts,
  useListTrains
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Train, Clock, CheckCircle2 } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useGetKpis();
  const { data: history, isLoading: historyLoading } = useGetKpiHistory();
  const { data: alerts, isLoading: alertsLoading } = useListAlerts();
  const { data: conflicts, isLoading: conflictsLoading } = useListConflicts();
  const { data: trains, isLoading: trainsLoading } = useListTrains();

  const activeAlerts = alerts?.filter(a => a.status === 'active') || [];
  const activeConflicts = conflicts?.filter(c => c.status === 'active') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Operations Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punctuality</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{kpis?.punctualityPct.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg delay: {kpis?.avgDelayMinutes.toFixed(1)} min
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trains</CardTitle>
            <Train className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{kpis?.totalActiveTrains}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis?.trainsOnTime} on time • {kpis?.trainsDelayed} delayed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {conflictsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold text-destructive">{activeConflicts.length}</div>
                <Link href="/conflicts" className="text-xs text-primary hover:underline mt-1 inline-block">
                  View conflicts →
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Load</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{kpis?.sectionUtilizationPct.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Throughput: {kpis?.throughputTrainsPerHour}/hr
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card">
          <CardHeader>
            <CardTitle>Network Performance Trend (24h)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {historyLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-full h-[250px]" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(val) => new Date(val).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="punctualityPct" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    name="Punctuality %"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgDelayMinutes" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    dot={false}
                    name="Avg Delay (m)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card">
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <AlertTriangle className={`h-5 w-5 shrink-0 ${
                      alert.severity === 'critical' ? 'text-destructive' : 
                      alert.severity === 'warning' ? 'text-orange-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">{alert.title}</p>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                      {alert.trainNumber && (
                        <Badge variant="outline" className="text-[10px] mt-2">
                          Train: {alert.trainNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
