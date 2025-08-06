import { useState, useEffect } from "react";
// import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useParams } from "wouter";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

// Temporarily comment out Stripe initialization
// if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
//   throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
// }
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Temporary payment forms while Stripe is unavailable
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
  const { toast } = useToast();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  
  const type = params.type as string;
  const eventId = params.id as string;

  const { data: event } = useQuery({
    queryKey: ["/api/events", eventId],
    enabled: type === "event" && !!eventId,
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600">Payment processing temporarily unavailable</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentUnavailableForm {...paymentInfo} />
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

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-gray-900 mb-1">Payment Processing Unavailable</p>
                      <p>Please contact BACO administration to complete your payment.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
