
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function EventRegistration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/events/:eventId/register");
  const [isRegistering, setIsRegistering] = useState(false);

  const eventId = params?.eventId;

  const { data: event, isLoading } = useQuery({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ["/api/event-registrations/my"],
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      setIsRegistering(true);
      
      if (event.price > 0) {
        // Navigate to checkout for paid events
        navigate(`/checkout/event/${eventId}`);
        return;
      }
      
      // Register for free events directly
      await apiRequest("POST", "/api/event-registrations", {
        eventId: eventId,
        paymentAmount: "0.00",
      });
    },
    onSuccess: () => {
      if (event?.price === 0) {
        toast({
          title: "Registration Successful!",
          description: "You have been successfully registered for this event.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/event-registrations/my"] });
        // Redirect to events page or show success state
        setTimeout(() => navigate("/events"), 2000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsRegistering(false);
    },
  });

  const isAlreadyRegistered = myRegistrations.some(
    (reg: any) => reg.eventId === eventId || reg.event?.id === eventId
  );

  if (!match) {
    navigate("/events");
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/events")}>
            Back to Events
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/events")}
            className="mb-4"
            data-testid="button-back-to-events"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Events
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Registration</h1>
          <p className="text-gray-600">Complete your registration for this BACO event</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2" data-testid="event-title">
                      {event.title}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <i className="fas fa-calendar mr-2"></i>
                        {format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-clock mr-2"></i>
                        {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                  {event.price > 0 ? (
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      ${event.price} BSD
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      Free Event
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{event.description}</p>
                  </div>
                  
                  {event.location && (
                    <div>
                      <h3 className="font-semibold mb-2">Location</h3>
                      <p className="text-gray-600 flex items-center">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        {event.location}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Capacity</h3>
                    <p className="text-gray-600">
                      {event.currentAttendees || 0} of {event.maxAttendees || 'Unlimited'} attendees registered
                    </p>
                    {event.maxAttendees && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-baco-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((event.currentAttendees || 0) / event.maxAttendees) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent>
                {isAlreadyRegistered ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-check text-green-600 text-2xl"></i>
                    </div>
                    <h3 className="font-semibold text-green-800 mb-2">Already Registered!</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      You're all set for this event. Check your registrations in your events page.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/events")}
                      className="w-full"
                    >
                      View My Events
                    </Button>
                  </div>
                ) : new Date(event.startDate) <= new Date() ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-clock text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="font-semibold text-gray-600 mb-2">Registration Closed</h3>
                    <p className="text-sm text-gray-500">
                      Registration for this event has ended.
                    </p>
                  </div>
                ) : event.maxAttendees && event.currentAttendees >= event.maxAttendees ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-users text-red-600 text-2xl"></i>
                    </div>
                    <h3 className="font-semibold text-red-800 mb-2">Event Full</h3>
                    <p className="text-sm text-gray-600">
                      This event has reached maximum capacity.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-t border-b py-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Registration Fee:</span>
                        <span className="font-semibold">
                          {event.price > 0 ? `$${event.price} BSD` : 'Free'}
                        </span>
                      </div>
                      {event.price > 0 && (
                        <p className="text-xs text-gray-500">
                          Payment will be processed securely through our payment system.
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => registerMutation.mutate()}
                      disabled={registerMutation.isPending || isRegistering}
                      className="w-full bg-baco-primary hover:bg-baco-secondary"
                      data-testid="button-complete-registration"
                    >
                      {registerMutation.isPending || isRegistering ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          {event.price > 0 ? 'Processing...' : 'Registering...'}
                        </>
                      ) : (
                        <>
                          {event.price > 0 ? `Pay $${event.price} & Register` : 'Complete Registration'}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      By registering, you agree to attend this BACO event and follow our community guidelines.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Quick Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Event Date:</span>
                  <span>{format(new Date(event.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span>
                    {Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60))} hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary" className="text-xs">
                    Registration Open
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
