import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import Documents from "@/pages/documents";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import Checkout from "@/pages/checkout";
import EventDetail from "@/pages/event-detail";
import PublicEvent from "@/pages/public-event";
import { lazy } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes (no auth required) */}
      <Route path="/events/:slug" component={PublicEvent} />
      
      {/* Authenticated routes */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/events" component={Events} />
          <Route path="/event/:eventId" component={EventDetail} />
          <Route path="/events/:eventId/register" component={lazy(() => import("@/pages/event-registration"))} />
          <Route path="/messages" component={Messages} />
          <Route path="/documents" component={Documents} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={Admin} />
          <Route path="/checkout/:type/:id" component={Checkout} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;