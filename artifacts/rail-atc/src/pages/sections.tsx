import { useListSections } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Map, TrendingUp, AlertTriangle } from "lucide-react";

export default function Sections() {
  const { data: sections, isLoading } = useListSections();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Track Sections</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="bg-card">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))
        ) : sections?.map((section) => {
          const utilization = (section.currentTrainCount / section.lineCapacity) * 100;
          
          return (
            <Card key={section.id} className={`bg-card ${section.status === 'blocked' ? 'border-destructive' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold">{section.name}</CardTitle>
                  <Badge variant={
                    section.status === 'clear' ? 'outline' : 
                    section.status === 'occupied' ? 'secondary' : 'destructive'
                  }>
                    {section.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Map className="h-3 w-3" />
                  {section.fromStation} → {section.toStation}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Length</span>
                    <span className="font-mono">{section.lengthKm} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gradient</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="capitalize">{section.gradient}</span>
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Capacity</span>
                      <span className="font-mono">
                        {section.currentTrainCount} / {section.lineCapacity} trains
                      </span>
                    </div>
                    <Progress 
                      value={utilization} 
                      className={`h-2 ${utilization >= 100 ? '[&>div]:bg-destructive' : utilization > 75 ? '[&>div]:bg-orange-500' : ''}`}
                    />
                    {utilization >= 100 && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" /> AT MAX CAPACITY
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
