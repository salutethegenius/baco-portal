import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Users, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";

export default function EventDetail() {
  const { eventId } = useParams();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  // Fetch user's registrations
  const { data: myRegistrations } = useQuery({
    queryKey: ["/api/event-registrations/my"],
    enabled: isAuthenticated,
  });

  

  if (eventLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
              <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
              <Button onClick={() => navigate("/events")}>Back to Events</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const isRegistered = myRegistrations?.some((reg: any) => 
    reg.eventId === event.id || reg.event?.id === event.id
  );

  const eventDate = new Date(event.startDate);
  const isPastEvent = eventDate <= new Date();
  const isFull = event.currentAttendees >= event.maxAttendees;

  const getRegistrationStatus = () => {
    if (isRegistered) return { text: "Registered", variant: "success", disabled: true };
    if (isPastEvent) return { text: "Past Event", variant: "secondary", disabled: true };
    if (isFull) return { text: "Event Full", variant: "destructive", disabled: true };
    return { text: event.price > 0 ? `Register - $${event.price}` : "Register Free", variant: "default", disabled: false };
  };

  const registrationStatus = getRegistrationStatus();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start mb-4">
              <Badge variant={isPastEvent ? "secondary" : "default"}>
                {isPastEvent ? "Past Event" : "Upcoming Event"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/events")}
                data-testid="button-back-to-events"
              >
                ← Back to Events
              </Button>
            </div>
            
            <CardTitle className="text-3xl font-bold mb-2" data-testid="text-event-title">
              {event.title}
            </CardTitle>
            
            <CardDescription className="text-lg" data-testid="text-event-description">
              {event.description}
            </CardDescription>

            {/* Event Flyer */}
            {event.flyerImageUrl && (
              <div className="mt-6">
                <img 
                  src={event.flyerImageUrl} 
                  alt={`${event.title} flyer`}
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Event Details */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p className="text-gray-600" data-testid="text-start-date">
                        {format(new Date(event.startDate), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-gray-600" data-testid="text-event-time">
                        {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-gray-600" data-testid="text-event-location">
                          {event.location}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Price</p>
                      <p className="text-gray-600" data-testid="text-event-price">
                        {event.price > 0 ? `$${event.price} BSD` : "Free"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-gray-600" data-testid="text-event-capacity">
                        {event.currentAttendees || 0} / {event.maxAttendees || '∞'} attendees
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Description (Extended) */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <p>{event.description}</p>
                  {/* Placeholder for additional event details */}
                  <p className="text-gray-600 mt-4">
                    More details about speakers, agenda, and event activities will be added here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Registration Card */}
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="text-registration-price">
                    {event.price > 0 ? `$${event.price}` : "FREE"}
                  </div>
                  {event.price > 0 && (
                    <p className="text-gray-600 text-sm">BSD (Bahamian Dollar)</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>Event Date:</span>
                    <span>{format(new Date(event.startDate), "MMM d, yyyy")}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span>Available Spots:</span>
                    <span>
                      {event.maxAttendees ? 
                        Math.max(0, event.maxAttendees - (event.currentAttendees || 0)) : 
                        'Unlimited'
                      }
                    </span>
                  </div>
                </div>

                <Separator />

                {!isAuthenticated ? (
                  <div className="space-y-3 text-center">
                    <p className="text-sm text-gray-600">
                      Please log in to register for this event
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => window.location.href = "/api/login"}
                      data-testid="button-login-to-register"
                    >
                      Login to Register
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant={registrationStatus.variant as any}
                    disabled={registrationStatus.disabled}
                    onClick={() => navigate(`/event-registration/event/${event.id}`)}
                    data-testid="button-register-event"
                  >
                    {registrationStatus.text}
                  </Button>
                )}

                {isRegistered && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ You are registered for this event
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      
    </Layout>
  );
}