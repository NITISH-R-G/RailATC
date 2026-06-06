import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Trains from "@/pages/trains";
import Schedule from "@/pages/schedule";
import Sections from "@/pages/sections";
import Conflicts from "@/pages/conflicts";
import Simulation from "@/pages/simulation";
import Audit from "@/pages/audit";
import Alerts from "@/pages/alerts";
import { Train, Calendar, LayoutGrid, AlertTriangle, PlayCircle, ClipboardList, Bell, Home, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { useHealthCheck } from "@workspace/api-client-react";

const queryClient = new QueryClient();

function Sidebar() {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: ["healthCheck"], refetchInterval: 10000 } });

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/trains", label: "Trains", icon: Train },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/sections", label: "Track Sections", icon: LayoutGrid },
    { href: "/conflicts", label: "Conflicts", icon: AlertTriangle },
    { href: "/simulation", label: "Simulation", icon: PlayCircle },
    { href: "/audit", label: "Audit Log", icon: ClipboardList },
    { href: "/alerts", label: "Alerts", icon: Bell },
  ];

  return (
    <div className="w-64 border-r border-sidebar-border bg-sidebar h-screen flex flex-col shrink-0">
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-2">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
          <Train size={20} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-sidebar-foreground">RailATC</h1>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Mission Control</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health?.status === "ok" ? "bg-green-500" : "bg-destructive animate-pulse"}`} />
            System Status
          </span>
          <span className="font-mono text-[10px]">{health?.status === "ok" ? "ONLINE" : "OFFLINE"}</span>
        </div>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity size={16} className="text-primary" />
              <span>Division: Central</span>
              <span className="mx-2">•</span>
              <span>Shift: 08:00 - 16:00</span>
            </div>
          </div>
          <div className="text-sm font-mono text-muted-foreground">
            {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
          </div>
        </div>
        <main className="p-6 flex-1 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/trains" component={Trains} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/sections" component={Sections} />
        <Route path="/conflicts" component={Conflicts} />
        <Route path="/simulation" component={Simulation} />
        <Route path="/audit" component={Audit} />
        <Route path="/alerts" component={Alerts} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
