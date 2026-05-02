import { useListScenarios, useRunSimulation, useListSections } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle, AlertTriangle, ArrowLeftRight, Clock, Network } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

const DISRUPTION_TYPES = ["breakdown", "weather_delay", "track_block", "increased_traffic", "signal_failure"] as const;

const simSchema = z.object({
  name: z.string().min(1, "Name is required"),
  disruptionType: z.enum(["breakdown", "weather_delay", "track_block", "increased_traffic", "signal_failure"]),
  durationMinutes: z.coerce.number().min(10).max(1440),
  affectedSectionId: z.coerce.number().optional()
});

type SimFormValues = z.infer<typeof simSchema>;

export default function Simulation() {
  const { data: scenarios, isLoading: scenariosLoading } = useListScenarios();
  const { data: sections, isLoading: sectionsLoading } = useListSections();
  const runMutation = useRunSimulation();
  
  const [result, setResult] = useState<any | null>(null);

  const form = useForm<SimFormValues>({
    resolver: zodResolver(simSchema),
    defaultValues: {
      name: "Custom What-if " + new Date().toISOString().slice(0,10),
      disruptionType: "track_block",
      durationMinutes: 60
    }
  });

  const onSubmit = (values: SimFormValues) => {
    runMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setResult(data);
      }
    });
  };

  const loadScenario = (scenario: any) => {
    form.reset({
      name: `Run: ${scenario.name}`,
      disruptionType: scenario.disruptionType as any,
      durationMinutes: 120, // default
      affectedSectionId: sections?.[0]?.id // arbitrary default
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">What-If Simulation Sandbox</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Configure Scenario</CardTitle>
              <CardDescription>Simulate network disruptions to evaluate impact and AI recovery plans.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Simulation Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="disruptionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disruption Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DISRUPTION_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replace(/_/g, " ").toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="affectedSectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Section (Optional)</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sections?.map((section) => (
                              <SelectItem key={section.id} value={section.id.toString()}>
                                {section.name} ({section.fromStation}-{section.toStation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={runMutation.isPending || sectionsLoading}>
                    {runMutation.isPending ? "Running Engine..." : "Execute Simulation"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">Pre-configured Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              {scenariosLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {scenarios?.map(scen => (
                    <Button 
                      key={scen.id} 
                      variant="outline" 
                      className="justify-start text-left h-auto py-3 px-4 flex-col items-start gap-1"
                      onClick={() => loadScenario(scen)}
                    >
                      <span className="font-semibold">{scen.name}</span>
                      <span className="text-xs text-muted-foreground font-normal line-clamp-1">{scen.description}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {runMutation.isPending ? (
            <Card className="bg-card h-full min-h-[400px] flex flex-col items-center justify-center border-primary animate-pulse">
              <PlayCircle className="h-16 w-16 text-primary mb-4 animate-spin" />
              <h3 className="text-xl font-bold">Running Predictive Engine</h3>
              <p className="text-muted-foreground mt-2">Calculating cascading network delays...</p>
            </Card>
          ) : result ? (
            <Card className="bg-card border-primary h-full">
              <CardHeader className="bg-sidebar border-b border-border pb-4">
                <CardTitle className="text-primary flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" /> Simulation Results
                </CardTitle>
                <CardDescription>{result.scenarioName}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Impacted Trains</p>
                    <p className="text-3xl font-bold text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> {result.impactedTrains}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Network Delay Added</p>
                    <p className="text-3xl font-bold text-orange-500 flex items-center gap-2">
                      <Clock className="h-5 w-5" /> +{result.delayMinutesAdded}m
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Throughput Impact</p>
                    <p className="text-3xl font-bold text-red-500">-{result.throughputImpactPct}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Est. Recovery Time</p>
                    <p className="text-3xl font-bold text-blue-500">{result.estimatedRecoveryMinutes}m</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 border-b pb-2">
                    <ArrowLeftRight className="h-4 w-4 text-primary" /> AI Recommended Actions
                  </h4>
                  <ul className="space-y-2">
                    {result.recommendedActions.map((action: string, i: number) => (
                      <li key={i} className="text-sm bg-muted/50 p-2 rounded border border-border">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                {result.alternativeRoutes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2 border-b pb-2">
                      <Network className="h-4 w-4 text-primary" /> Viable Alternative Routes
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {result.alternativeRoutes.map((route: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {route}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card h-full min-h-[400px] flex flex-col items-center justify-center border-dashed border-2">
              <PlayCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center max-w-xs">
                Configure parameters and execute a simulation to view predictive network impacts and AI recovery strategies.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
