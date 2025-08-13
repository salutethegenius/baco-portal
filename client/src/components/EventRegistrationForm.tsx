import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

interface EventRegistrationFormProps {
  event: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_OPTIONS = {
  member_one_day: {
    title: "One Day Member Early Bird Rate",
    price: 400,
    paylanesUrl: "https://paylanes.sprocket.solutions/merchant/paynow/POQF10X7"
  },
  member_two_day: {
    title: "Two Day Member Early Bird Rate",
    price: 650,
    paylanesUrl: "https://paylanes.sprocket.solutions/merchant/paynow/TvE9LbMv"
  },
  non_member_one_day: {
    title: "Non Member One Day Early Bird Rate",
    price: 500,
    paylanesUrl: "https://paylanes.sprocket.solutions/merchant/paynow/u2U2RNGA"
  },
  non_member_two_day: {
    title: "Non Member Two Day Early Bird Rate",
    price: 750,
    paylanesUrl: "https://paylanes.sprocket.solutions/merchant/paynow/ZtIvsYIp"
  }
};

const BANK_TRANSFER_INFO = {
  name: "Bahamas Association of Compliance Officers",
  address: "Union Court Building Elizabeth Avenue & Shirley Street, Nassau Bahamas",
  bank: "CIBC FirstCaribbean International Bank",
  swift: "FCIBBSNS",
  accountNumber: "201750803",
  accountType: "Checking",
  transitNumber: "9706"
};

export default function EventRegistrationForm({ event, onClose, onSuccess }: EventRegistrationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    position: "",
    phoneNumber: "",
    notes: "",
    registrationType: "member_two_day",
    paymentMethod: "paylanes"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const selectedOption = PAYMENT_OPTIONS[formData.registrationType as keyof typeof PAYMENT_OPTIONS];

      // Create registration record
      const registration = await apiRequest("POST", "/api/event-registrations", {
        eventId: event.id,
        fullName,
        email: formData.email,
        companyName: formData.companyName,
        position: formData.position,
        phone: formData.phoneNumber,
        notes: formData.notes,
        registrationType: formData.registrationType,
        paymentMethod: formData.paymentMethod,
        paymentAmount: selectedOption.price.toString()
      });

      if (!registration.ok) {
        throw new Error("Failed to create registration");
      }

      // Handle payment method
      if (formData.paymentMethod === "paylanes") {
        // Redirect to Paylanes
        const paymentUrl = `${selectedOption.paylanesUrl}?amount=${selectedOption.price}&description=Event Registration: ${encodeURIComponent(event.title)} - ${selectedOption.title}`;
        window.location.href = paymentUrl;
      } else {
        // Bank transfer - show success message with bank details
        return { bankTransfer: true };
      }
    },
    onSuccess: (result) => {
      if (result?.bankTransfer) {
        toast({
          title: "Registration Successful!",
          description: "Please complete payment via bank transfer using the details provided.",
          duration: 5000,
        });
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Comprehensive validation
    const errors = [];

    if (!formData.firstName?.trim()) errors.push("First name is required");
    if (!formData.lastName?.trim()) errors.push("Last name is required");
    if (!formData.email?.trim()) errors.push("Email is required");
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate();
  };

  const selectedOption = PAYMENT_OPTIONS[formData.registrationType as keyof typeof PAYMENT_OPTIONS];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Event Registration - {event.title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Your company or organization"
                />
              </div>
              <div>
                <Label htmlFor="position">Position/Title</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Registration Type */}
            <div className="space-y-4">
              <h3 className="font-semibold">Registration Type</h3>
              <RadioGroup
                value={formData.registrationType}
                onValueChange={(value) => setFormData({ ...formData, registrationType: value })}
              >
                {Object.entries(PAYMENT_OPTIONS).map(([key, option]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <RadioGroupItem value={key} id={key} />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span>{option.title}</span>
                        <span className="font-semibold">${option.price} BSD</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="font-semibold">Payment Method</h3>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paylanes" id="paylanes" />
                  <Label htmlFor="paylanes" className="cursor-pointer">
                    Online Payment (Paylanes) - Instant Processing
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="cursor-pointer">
                    Direct Bank Transfer
                  </Label>
                </div>
              </RadioGroup>

              {formData.paymentMethod === "bank_transfer" && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Bank Transfer Details</h4>
                    <div className="text-sm space-y-1 text-blue-800">
                      <div><strong>Account Name:</strong> {BANK_TRANSFER_INFO.name}</div>
                      <div><strong>Bank:</strong> {BANK_TRANSFER_INFO.bank}</div>
                      <div><strong>Account Number:</strong> {BANK_TRANSFER_INFO.accountNumber}</div>
                      <div><strong>Swift Code:</strong> {BANK_TRANSFER_INFO.swift}</div>
                      <div><strong>Account Type:</strong> {BANK_TRANSFER_INFO.accountType}</div>
                      <div><strong>Transit Number:</strong> {BANK_TRANSFER_INFO.transitNumber}</div>
                      <div><strong>Address:</strong> {BANK_TRANSFER_INFO.address}</div>
                    </div>
                    <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-900">
                      <strong>Note:</strong> Please include your name and "Event Registration - {event.title}" in the transfer reference.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Registration Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Registration Type:</span>
                  <span>{selectedOption.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{formData.paymentMethod === "paylanes" ? "Online Payment" : "Bank Transfer"}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total Amount:</span>
                  <span>${selectedOption.price} BSD</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Processing...
                  </>
                ) : formData.paymentMethod === "paylanes" ? (
                  `Pay $${selectedOption.price} Online`
                ) : (
                  `Register & Get Bank Details`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}