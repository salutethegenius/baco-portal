import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  position: z.string().min(2, "Position/title must be at least 2 characters"),
  company: z.string().min(2, "Company/organization must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  notes: z.string().optional(),
});

type RegistrationData = z.infer<typeof registrationSchema>;

interface EventRegistrationFormProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EventRegistrationForm({
  event,
  onClose,
  onSuccess,
}: EventRegistrationFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      position: "",
      company: "",
      phone: "",
      notes: "",
    },
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const response = await apiRequest("POST", "/api/event-registrations", {
        eventId: event.id,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Registration Successful",
        description: "Your registration has been submitted successfully!",
        variant: "default",
      });
      setTimeout(() => {
        onSuccess();
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationData) => {
    registrationMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              Registration Confirmed!
            </DialogTitle>
            <DialogDescription className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <p className="text-lg font-medium">
                You're registered for {event.title}!
              </p>
              
              <p className="text-gray-600">
                We'll send you confirmation details and any updates about the event to your email address.
              </p>
              
              {event.price && parseFloat(event.price) > 0 && (
                <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                  <strong>Payment Instructions:</strong> Our team will contact you separately 
                  with payment details and instructions for the ${event.price} BSD registration fee.
                </p>
              )}
              
              <Button
                onClick={onClose}
                className="w-full mt-4"
                data-testid="button-close-confirmation"
              >
                Close
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Registration</DialogTitle>
          <DialogDescription>
            Complete your registration for <strong>{event.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        {...field}
                        data-testid="input-registration-fullname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        {...field}
                        data-testid="input-registration-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position/Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your job title or role"
                        {...field}
                        data-testid="input-registration-position"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company/Organization *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your company or organization"
                        {...field}
                        data-testid="input-registration-company"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1 (242) 000-0000"
                      {...field}
                      data-testid="input-registration-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any dietary restrictions, accessibility needs, or special requests..."
                      rows={3}
                      {...field}
                      data-testid="textarea-registration-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Event Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Event:</strong> {event.title}</p>
                {event.startDate && (
                  <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</p>
                )}
                {event.location && <p><strong>Location:</strong> {event.location}</p>}
                <p><strong>Fee:</strong> {event.price && parseFloat(event.price) > 0 ? `$${event.price} BSD` : 'Free'}</p>
              </div>
            </div>

            {event.price && parseFloat(event.price) > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Payment Note:</strong> Registration details will be collected now. 
                  Our team will contact you separately with payment instructions for the ${event.price} BSD fee.
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={registrationMutation.isPending}
                className="flex-1"
                data-testid="button-submit-registration"
              >
                {registrationMutation.isPending ? "Submitting..." : "Complete Registration"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={registrationMutation.isPending}
                className="flex-1"
                data-testid="button-cancel-registration"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}