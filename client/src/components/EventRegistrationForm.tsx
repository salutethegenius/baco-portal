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
      const response = await apiRequest("POST", "/api/event-registrations", {
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

      if (!response.ok) {
        throw new Error("Failed to create registration");
      }

      const registration = await response.json();

      // Check if user is already registered
      if (registration.alreadyRegistered) {
        // Get the payment option for their existing registration type
        const existingOption = PAYMENT_OPTIONS[registration.registrationType as keyof typeof PAYMENT_OPTIONS];
        
        if (registration.paymentMethod === "paylanes") {
          // Redirect to their Paylanes payment link
          const paymentUrl = `${existingOption.paylanesUrl}?amount=${existingOption.price}&description=Event Registration: ${encodeURIComponent(event.title)} - ${existingOption.title}`;
          
          toast({
            title: "Already Registered!",
            description: `You're registered for ${existingOption.title}. Redirecting to payment...`,
            duration: 3000,
          });
          
          setTimeout(() => {
            window.location.href = paymentUrl;
          }, 1500);
          
          return { alreadyRegistered: true, paylanes: true };
        } else if (registration.paymentMethod === "cheque") {
          toast({
            title: "Already Registered!",
            description: `You're registered for ${existingOption.title}. Please send your cheque payment to BACO.`,
            duration: 5000,
          });
          setIsSubmitting(false);
          setTimeout(() => onSuccess(), 2000);
          return { alreadyRegistered: true, chequePayment: true };
        } else {
          // Bank transfer
          toast({
            title: "Already Registered!",
            description: `You're registered for ${existingOption.title}. Please complete payment via bank transfer.`,
            duration: 5000,
          });
          setIsSubmitting(false);
          setTimeout(() => onSuccess(), 2000);
          return { alreadyRegistered: true, bankTransfer: true };
        }
      }

      // Handle payment method for new registrations
      if (formData.paymentMethod === "paylanes") {
        // Redirect to Paylanes
        const paymentUrl = `${selectedOption.paylanesUrl}?amount=${selectedOption.price}&description=Event Registration: ${encodeURIComponent(event.title)} - ${selectedOption.title}`;
        window.location.href = paymentUrl;
      } else if (formData.paymentMethod === "cheque") {
        // Cheque payment - show success message
        return { chequePayment: true };
      } else {
        // Bank transfer - show success message with bank details
        return { bankTransfer: true };
      }
    },
    onSuccess: (result) => {
      // For already registered users, the mutation function handles everything
      if (result?.alreadyRegistered) {
        // Toast and modal closure already handled in mutation function
        return;
      }
      
      // For new registrations
      if (result?.bankTransfer) {
        toast({
          title: "Registration Successful!",
          description: "Please complete payment via bank transfer using the details provided.",
          duration: 5000,
        });
        onSuccess();
      } else if (result?.chequePayment) {
        toast({
          title: "Registration Successful!",
          description: "Please send your cheque payment to BACO. You will receive confirmation once payment is received.",
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
                    data-testid="input-firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    data-testid="input-lastName"
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
                  data-testid="input-email"
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
                data-testid="radiogroup-registrationType"
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
                data-testid="radiogroup-paymentMethod"
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cheque" id="cheque" />
                  <Label htmlFor="cheque" className="cursor-pointer">
                    Cheque Payment
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

              {formData.paymentMethod === "cheque" && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-green-900 mb-3">Cheque Payment Details</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-green-900 font-medium">Registration Duration</Label>
                        <RadioGroup
                          data-testid="radiogroup-chequeDays"
                          value={formData.registrationType.includes('one_day') ? 'one_day' : 'two_day'}
                          onValueChange={(value) => {
                            const membershipType = formData.registrationType.includes('member') && !formData.registrationType.includes('non_member') ? 'member' : 'non_member';
                            setFormData({ ...formData, registrationType: `${membershipType}_${value}` });
                          }}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="one_day" id="cheque_one_day" />
                            <Label htmlFor="cheque_one_day" className="text-green-800">1 Day Registration</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="two_day" id="cheque_two_day" />
                            <Label htmlFor="cheque_two_day" className="text-green-800">2 Day Registration</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div>
                        <Label className="text-green-900 font-medium">Membership Status</Label>
                        <RadioGroup
                          data-testid="radiogroup-chequeMembership"
                          value={formData.registrationType.includes('member') && !formData.registrationType.includes('non_member') ? 'member' : 'non_member'}
                          onValueChange={(value) => {
                            const duration = formData.registrationType.includes('one_day') ? 'one_day' : 'two_day';
                            setFormData({ ...formData, registrationType: `${value}_${duration}` });
                          }}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="member" id="cheque_member" />
                            <Label htmlFor="cheque_member" className="text-green-800">BACO Member</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="non_member" id="cheque_non_member" />
                            <Label htmlFor="cheque_non_member" className="text-green-800">Non-Member</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-green-100 rounded text-sm text-green-900">
                      <div className="space-y-1">
                        <p><strong>Make cheque payable to:</strong> {BANK_TRANSFER_INFO.name}</p>
                        <p><strong>Mail to:</strong> {BANK_TRANSFER_INFO.address}</p>
                        <p><strong>Amount:</strong> ${selectedOption.price} BSD</p>
                        <p className="text-xs mt-2"><strong>Note:</strong> Please write your name and "Event Registration - {event.title}" on the memo line.</p>
                      </div>
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
                  <span>
                    {formData.paymentMethod === "paylanes" 
                      ? "Online Payment" 
                      : formData.paymentMethod === "cheque" 
                      ? "Cheque Payment" 
                      : "Bank Transfer"
                    }
                  </span>
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
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Processing...
                  </>
                ) : formData.paymentMethod === "paylanes" ? (
                  `Pay $${selectedOption.price} Online`
                ) : formData.paymentMethod === "cheque" ? (
                  `Register & Submit`
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