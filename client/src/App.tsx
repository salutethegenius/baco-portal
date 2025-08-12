import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import Documents from "@/pages/documents";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import Checkout from "@/pages/checkout";
import EventDetail from "@/pages/event-detail";
import PublicEvent from "@/pages/public-event";
import MemberRegistration from "@/pages/member-registration";
import EventRegistration from "@/pages/event-registration";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-baco-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes (no auth required) */}
      <Route path="/events/:slug" component={PublicEvent} />
      <Route path="/member-registration" component={MemberRegistration} />

      {/* Authentication route */}
      <Route path="/auth" component={AuthPage} />

      {/* Authenticated routes */}
      {!isAuthenticated ? (
        <Route path="/" component={AuthPage} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/events" component={Events} />
          <Route path="/event/:eventId" component={EventDetail} />
          <Route path="/event-registration/event/:eventId" component={EventRegistration} />
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