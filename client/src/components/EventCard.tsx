import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EventCardProps {
  event: any;
  registration?: any;
  isPast?: boolean;
  showRegistrationDetails?: boolean;
}

export default function EventCard({ 
  event, 
  registration, 
  isPast = false, 
  showRegistrationDetails = false 
}: EventCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
          isPast ? "bg-gray-100" : "bg-baco-primary/10"
        }`}>
          <span className={`text-xs font-medium ${
            isPast ? "text-gray-500" : "text-baco-primary"
          }`}>
            {format(new Date(event.startDate), 'MMM')}
          </span>
          <span className={`text-sm font-bold ${
            isPast ? "text-gray-500" : "text-baco-primary"
          }`}>
            {format(new Date(event.startDate), 'd')}
          </span>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-1" data-testid={`event-title-${event.id}`}>
              {event.title}
            </h3>
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{event.description}</p>
            
            <div className="flex items-center text-xs text-gray-500 space-x-4 mb-3">
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
              {event.price > 0 && (
                <span className="font-semibold text-gray-900">
                  ${event.price} BSD
                </span>
              )}
            </div>

            {showRegistrationDetails && registration && (
              <div className="flex items-center space-x-3 mb-3">
                <Badge 
                  variant={getStatusVariant(registration.paymentStatus)}
                  data-testid={`registration-status-${registration.id}`}
                >
                  Payment: {registration.paymentStatus}
                </Badge>
                <span className="text-xs text-gray-500">
                  Registered: {format(new Date(registration.registrationDate), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 ml-4">
            {showRegistrationDetails ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                Registered
              </Badge>
            ) : isPast ? (
              <Badge variant="secondary">
                Past Event
              </Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                Registration Open
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3 mt-3">
          <Button 
            variant="outline" 
            size="sm"
            data-testid={`button-view-details-${event.id}`}
          >
            View Details
          </Button>
          
          {showRegistrationDetails && registration?.paymentStatus === "paid" && (
            <Button 
              variant="outline" 
              size="sm"
              data-testid={`button-download-ticket-${event.id}`}
            >
              Download Ticket
            </Button>
          )}
          
          {!isPast && !showRegistrationDetails && (
            <Button 
              size="sm"
              className="bg-baco-primary hover:bg-baco-secondary"
              data-testid={`button-register-${event.id}`}
            >
              {event.price > 0 ? `Register - $${event.price}` : 'Register (Free)'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
