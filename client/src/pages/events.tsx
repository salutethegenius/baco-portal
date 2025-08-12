import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import EventRegistrationForm from "@/components/EventRegistrationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function Events() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { user } = useAuth();

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
  });

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ["/api/event-registrations/my"],
  });

  const registerMutation = useMutation({
    mutationFn: async (eventData: any) => {
      if (eventData.price > 0) {
        // For paid events, redirect to Paylanes payment system
        const paymentUrl = `https://paylanes.sprocket.solutions/merchant/paynow/POQF10X7?amount=${eventData.price}&description=Event Registration: ${encodeURIComponent(eventData.title)}`;
        window.location.href = paymentUrl;
        return;
      }

      // Register for free events directly
      await apiRequest("POST", "/api/event-registrations", {
        eventId: eventData.id,
        paymentAmount: "0.00",
      });
    },
    onSuccess: (_, eventData) => {
      if (eventData.price === 0) {
        toast({
          title: "Registration Successful",
          description: "You have been registered for the event!",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/event-registrations/my"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const now = new Date();
  const upcomingEvents = (events || []).filter((event: any) => {
    const eventDate = new Date(event.startDate);
    return eventDate > now;
  });
  const pastEvents = (events || []).filter((event: any) => {
    const eventDate = new Date(event.startDate);
    return eventDate <= now;
  });

  const registeredEventIds = new Set((myRegistrations || []).map((reg: any) => reg.eventId || reg.event?.id));

  const isRegistered = (eventId: string) => registeredEventIds.has(eventId);

  const getEventStatus = (event: any) => {
    if (isRegistered(event.id)) {
      return { text: "Registered", variant: "success" };
    }
    const eventDate = new Date(event.startDate);
    if (eventDate <= new Date()) {
      return { text: "Past Event", variant: "secondary" };
    }
    if (event.currentAttendees >= event.maxAttendees) {
      return { text: "Full", variant: "destructive" };
    }
    return { text: "Registration Open", variant: "default" };
  };

  const setSelectedEventForRegistration = (event: any) => {
    setSelectedEvent(event);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
            <p className="text-gray-600">
              Discover and register for BACO professional development events and workshops.
            </p>
          </div>
          {user?.isAdmin && (
            <Button
              onClick={() => navigate("/admin")}
              className="bg-baco-primary hover:bg-baco-secondary"
              data-testid="button-create-event"
            >
              <i className="fas fa-plus mr-2"></i>
              Create Event
            </Button>
          )}
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming-events">
              Upcoming Events ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past-events">
              Past Events ({pastEvents.length})
            </TabsTrigger>
            <TabsTrigger value="registered" data-testid="tab-my-registrations">
              My Registrations ({(myRegistrations || []).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event: any) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-baco-primary bg-opacity-10 rounded-lg flex flex-col items-center justify-center">
                              <span className="text-xs font-medium text-baco-primary">
                                {format(new Date(event.startDate), 'MMM')}
                              </span>
                              <span className="text-sm font-bold text-baco-primary">
                                {format(new Date(event.startDate), 'd')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900" data-testid={`text-event-title-${event.id}`}>
                              {event.title}
                            </h3>
                            <p className="text-gray-600 mt-1">{event.description}</p>
                            <div className="flex items-center mt-2 text-sm text-gray-500 space-x-4">
                              <span className="flex items-center">
                                <i className="fas fa-clock mr-1"></i>
                                {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                              </span>
                              {event.location && (
                                <span className="flex items-center">
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Badge 
                              variant={getEventStatus(event).variant as any}
                              data-testid={`badge-event-status-${event.id}`}
                            >
                              {getEventStatus(event).text}
                            </Badge>
                            {event.price > 0 && (
                              <span className="text-lg font-semibold text-gray-900">
                                ${event.price} BSD
                              </span>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              variant="outline"
                              onClick={() => navigate(`/event/${event.id}`)}
                              data-testid={`button-view-event-page-${event.id}`}
                            >
                              View Event Page
                            </Button>

                            {!isRegistered(event.id) && new Date(event.startDate) > new Date() && (event.maxAttendees === null || event.maxAttendees === undefined || (event.currentAttendees || 0) < event.maxAttendees) && (
                              <Dialog open={selectedEvent?.id === event.id} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => setSelectedEventForRegistration(event)}
                                    className="bg-baco-primary hover:bg-baco-secondary"
                                    data-testid={`button-register-${event.id}`}
                                  >
                                    {event.price > 0 ? `Register - $${event.price}` : 'Register (Free)'}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Register for {event.title}</DialogTitle>
                                  </DialogHeader>
                                  <EventRegistrationForm event={event} onClose={() => setSelectedEvent(null)} />
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <i className="fas fa-calendar-times text-gray-400 text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Events</h3>
                  <p className="text-gray-500">Check back soon for new events and workshops.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            {pastEvents.length > 0 ? (
              pastEvents.map((event: any) => (
                <EventCard key={event.id} event={event} isPast={true} />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <i className="fas fa-history text-gray-400 text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Events</h3>
                  <p className="text-gray-500">Past events will appear here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="registered" className="space-y-6">
            {(myRegistrations || []).length > 0 ? (
              (myRegistrations || []).map((registration: any) => (
                <Card key={registration.id}>
                  <CardContent className="p-6">
                    <EventCard 
                      event={registration.event} 
                      registration={registration}
                      showRegistrationDetails={true}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <i className="fas fa-calendar-check text-gray-400 text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Registrations</h3>
                  <p className="text-gray-500">You haven't registered for any events yet.</p>
                  <Button 
                    className="mt-4 bg-baco-primary hover:bg-baco-secondary"
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]');
                      const upcomingTab = tabsList?.querySelector('[value="upcoming"]') as HTMLElement;
                      upcomingTab?.click();
                    }}
                    data-testid="button-browse-events"
                  >
                    Browse Upcoming Events
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}