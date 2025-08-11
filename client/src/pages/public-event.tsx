import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import EventRegistrationForm from "@/components/EventRegistrationForm";
import { useAuth } from "@/hooks/useAuth";

export default function PublicEvent() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch event by slug using public API (no auth required)
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ["/api/public/events", slug],
    queryFn: async () => {
      const response = await fetch(`/api/public/events/${slug}`);
      if (!response.ok) throw new Error("Event not found");
      return response.json();
    },
  });

  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false);

    // If user is authenticated, redirect to events page to see their registrations
    if (isAuthenticated) {
      setLocation("/events");
    }
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-baco-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600">The event you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.startDate);
  const eventEndDate = new Date(event.endDate);
  const isPastEvent = eventDate < new Date();

  const registrationStatus = isPastEvent
    ? { text: "Event Ended", variant: "secondary", disabled: true }
    : event.currentAttendees >= event.maxAttendees
    ? { text: "Event Full", variant: "secondary", disabled: true }
    : { text: "Register Now", variant: "default", disabled: false };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-baco-primary">BACO Events</h1>
            <p className="text-gray-600 mt-2">Bahamas Association of Compliance Officers</p>
          </div>
        </div>
      </header>

      {/* Event Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {/* Event Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {isPastEvent && <Badge variant="secondary">Past Event</Badge>}
                  {!isPastEvent && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Upcoming
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {event.title}
                </h1>
                {event.description && (
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {event.description}
                  </p>
                )}
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-baco-primary" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-gray-900">
                      {format(eventDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-baco-primary" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Time</p>
                    <p className="text-gray-900">
                      {format(eventDate, "h:mm a")} - {format(eventEndDate, "h:mm a")}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-baco-primary" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-gray-900">{event.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-baco-primary" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-gray-900">
                      {event.price && parseFloat(event.price) > 0
                        ? `$${event.price} BSD`
                        : "Free"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Event Registration</CardTitle>
                <CardDescription className="text-lg">
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
          </div>
        </div>
      </div>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <EventRegistrationForm
          event={event}
          onClose={() => setShowRegistrationForm(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
}