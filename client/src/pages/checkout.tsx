import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Layout from "@/components/Layout";
import StripePaymentForm from "@/components/StripePaymentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { AlertTriangle, Loader2 } from "lucide-react";

// Initialize Stripe with publishable key
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

// Payment unavailable fallback form
const PaymentUnavailableForm = ({ type, amount, description }: any) => {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Payment Processing Unavailable</h3>
            <p className="text-yellow-700 mt-1">
              Online payment processing is temporarily unavailable. Please contact BACO administration to complete your {type === 'subscription' ? 'membership registration' : 'event registration'}.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Contact Information:</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Email:</strong> admin@bacoinfo.org</p>
          <p><strong>Phone:</strong> +1 (242) 123-4567</p>
          <p><strong>Amount Due:</strong> ${amount} BSD</p>
          <p><strong>Description:</strong> {description}</p>
        </div>
      </div>
      
      <Button
        type="button"
        disabled
        className="w-full bg-gray-400 cursor-not-allowed"
        data-testid="button-payment-unavailable"
      >
        Payment Processing Unavailable
      </Button>
    </div>
  );
};

export default function Checkout() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const type = params.type as string;
  const eventId = params.id as string;

  // Check if Stripe is available
  const { data: stripeStatus } = useQuery({
    queryKey: ["/api/stripe-status"],
  });

  const { data: event } = useQuery({
    queryKey: ["/api/events", eventId],
    enabled: type === "event" && !!eventId,
  });

  // Create payment intent mutation
  const createPaymentIntent = useMutation({
    mutationFn: async (data: { amount: number; type: string; description: string; eventId?: string }) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", data);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (type === "membership") {
      setPaymentInfo({
        type: "subscription",
        description: "BACO Annual Membership",
        amount: "350.00",
      });
    } else if (type === "event" && event) {
      setPaymentInfo({
        type: "event",
        description: `Event Registration: ${event.title}`,
        amount: event.price,
        event: event,
      });
    }
  }, [type, event]);

  // Create payment intent when payment info is ready and Stripe is available
  useEffect(() => {
    if (paymentInfo && stripeStatus?.available && !clientSecret) {
      createPaymentIntent.mutate({
        amount: parseFloat(paymentInfo.amount),
        type: paymentInfo.type,
        description: paymentInfo.description,
        eventId: eventId || undefined,
      });
    }
  }, [paymentInfo, stripeStatus?.available]);

  const handlePaymentSuccess = () => {
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  if (!paymentInfo) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-baco-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading"/>
            <p className="text-gray-600">Loading payment information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const isStripeAvailable = stripeStatus?.available && stripePromise;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600">
            {isStripeAvailable 
              ? "Secure payment processing powered by Stripe" 
              : "Payment processing temporarily unavailable"}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                {isStripeAvailable && clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#1e3a5f",
                          colorBackground: "#ffffff",
                          colorText: "#1f2937",
                          colorDanger: "#ef4444",
                          fontFamily: "Inter, system-ui, sans-serif",
                          borderRadius: "8px",
                        },
                      },
                    }}
                  >
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      amount={paymentInfo.amount}
                      description={paymentInfo.description}
                      type={paymentInfo.type === "subscription" ? "membership" : "event"}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                ) : isStripeAvailable && !clientSecret ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-baco-primary mx-auto mb-4" />
                    <p className="text-gray-600">Initializing payment...</p>
                  </div>
                ) : (
                  <PaymentUnavailableForm {...paymentInfo} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900" data-testid="text-order-description">
                    {paymentInfo.description}
                  </h3>
                  
                  {paymentInfo.event && (
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p>
                        <i className="fas fa-calendar mr-2"></i>
                        {format(new Date(paymentInfo.event.startDate), 'MMMM d, yyyy h:mm a')}
                      </p>
                      {paymentInfo.event.location && (
                        <p>
                          <i className="fas fa-map-marker-alt mr-2"></i>
                          {paymentInfo.event.location}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {paymentInfo.type === "subscription" ? "Annual Fee" : "Registration Fee"}
                  </span>
                  <span className="font-medium" data-testid="text-amount">
                    ${paymentInfo.amount} BSD
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span className="text-lg" data-testid="text-total">
                    ${paymentInfo.amount} BSD
                  </span>
                </div>

                {isStripeAvailable ? (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-green-800 mb-1">Secure Payment</p>
                        <p className="text-green-700">Your payment information is encrypted and secure.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-gray-900 mb-1">Payment Processing Unavailable</p>
                        <p>Please contact BACO administration to complete your payment.</p>
                      </div>
                    </div>
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
