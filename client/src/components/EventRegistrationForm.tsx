import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { X } from "lucide-react";

interface EventRegistrationFormProps {
  event: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EventRegistrationForm({ event, onClose, onSuccess }: EventRegistrationFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    phoneNumber: "",
    notes: "",
  });

  const registerMutation = useMutation({
    mutationFn: async (registrationData: typeof formData) => {
      const response = await apiRequest("POST", "/api/event-registrations", {
        eventId: event.id,
        ...registrationData,
        paymentStatus: "pending", // Will be updated when payment is processed later
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Submitted",
        description: "Your registration has been submitted. We'll contact you with payment instructions.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/event-registrations/my"] });
      onSuccess();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login Required",
          description: "Please log in to register for events.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email address.",
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 h-6 w-6 p-0"
            data-testid="button-close-registration-form"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="pr-8">Register for Event</CardTitle>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{event.title}</p>
            <p>
              {new Date(event.startDate).toLocaleDateString()} at{" "}
              {new Date(event.startDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {event.price > 0 && (
              <p className="font-medium text-primary">${event.price} BSD</p>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">First Name *</label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange("firstName")}
                  required
                  data-testid="input-first-name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">Last Name *</label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange("lastName")}
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address *</label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="position" className="text-sm font-medium">Position/Title</label>
              <Input
                id="position"
                value={formData.position}
                onChange={handleInputChange("position")}
                placeholder="e.g. Compliance Officer, Risk Manager"
                data-testid="input-position"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange("phoneNumber")}
                placeholder="e.g. (242) 123-4567"
                data-testid="input-phone-number"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">Additional Notes</label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={handleInputChange("notes")}
                placeholder="Any dietary restrictions, special accommodations, or questions..."
                rows={3}
                data-testid="textarea-notes"
              />
            </div>

            {event.price > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Payment:</strong> This event costs ${event.price} BSD. 
                  After submitting your registration, we'll contact you with payment instructions.
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                data-testid="button-submit-registration"
              >
                {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={registerMutation.isPending}
                data-testid="button-cancel-registration"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}