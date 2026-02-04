import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useParams } from "wouter";
import { format } from "date-fns";
import { AlertTriangle, Loader2, CreditCard, Wallet } from "lucide-react";

const PaymentUnavailableForm = ({ type, amount, description }: { type: string; amount: string; description: string }) => {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Payment Processing Unavailable</h3>
            <p className="text-yellow-700 mt-1">
              Online payment processing is temporarily unavailable. Please contact BACO administration to complete your {type === "subscription" ? "membership registration" : "event registration"}.
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
      <Button type="button" disabled className="w-full bg-gray-400 cursor-not-allowed" data-testid="button-payment-unavailable">
        Payment Processing Unavailable
      </Button>
    </div>
  );
};

export default function Checkout() {
  const params = useParams();
  const { toast } = useToast();
  const [paymentInfo, setPaymentInfo] = useState<{ type: string; description: string; amount: string; event?: any } | null>(null);

  const type = params.type as string;
  const eventId = params.id as string;

  const { data: cngStatus } = useQuery<{ available: boolean }>({
    queryKey: ["/api/cng/status"],
  });

  const { data: event } = useQuery<any>({
    queryKey: ["/api/events", eventId],
    enabled: type === "event" && !!eventId,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: { amount: number; type: string; description: string; eventId?: string }) => {
      const response = await apiRequest("POST", "/api/cng/create-payment", data);
      return response.json();
    },
    onSuccess: (data: { redirectUrl: string }) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start payment",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (type === "membership") {
      setPaymentInfo({
        type: "membership",
        description: "BACO Annual Membership",
        amount: "350.00",
      });
    } else if (type === "event" && event) {
      setPaymentInfo({
        type: "event",
        description: `Event Registration: ${event.title}`,
        amount: String(event.price),
        event,
      });
    }
  }, [type, event]);

  const handlePayWithCNG = () => {
    if (!paymentInfo) return;
    createPaymentMutation.mutate({
      amount: parseFloat(paymentInfo.amount),
      type: paymentInfo.type,
      description: paymentInfo.description,
      eventId: eventId || undefined,
    });
  };

  if (!paymentInfo) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-baco-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading" />
            <p className="text-gray-600">Loading payment information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const amountNum = parseFloat(paymentInfo.amount);
  const isFreeEvent = type === "event" && (isNaN(amountNum) || amountNum < 1);
  const isCngAvailable = cngStatus?.available && !isFreeEvent;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Payments temporarily disabled.</strong> Online payment processing is under maintenance. Please contact BACO administration to complete your payment.
          </p>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600">
            {isFreeEvent
              ? "This event is free—complete registration on the event page."
              : isCngAvailable
                ? "Secure payment via Cash N' Go (Card, Sand Dollar, CashNGo Wallet, MoneyMaxx)"
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
                {isFreeEvent ? (
                  <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      This event is free. Please complete your registration on the event page.
                    </p>
                    <Button variant="outline" onClick={() => window.location.href = "/events"}>
                      Back to Events
                    </Button>
                  </div>
                ) : isCngAvailable ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      You will be redirected to the secure Cash N' Go payment page to complete your payment.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Card</span>
                      <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> Sand Dollar</span>
                      <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> CashNGo</span>
                      <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> MoneyMaxx</span>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handlePayWithCNG}
                      disabled={createPaymentMutation.isPending}
                      data-testid="button-pay-cng"
                    >
                      {createPaymentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Redirecting...
                        </>
                      ) : (
                        "Pay with CNG"
                      )}
                    </Button>
                  </div>
                ) : (
                  <PaymentUnavailableForm type={paymentInfo.type} amount={paymentInfo.amount} description={paymentInfo.description} />
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
                      <p>{format(new Date(paymentInfo.event.startDate), "MMMM d, yyyy h:mm a")}</p>
                      {paymentInfo.event.location && <p>{paymentInfo.event.location}</p>}
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {paymentInfo.type === "subscription" || paymentInfo.type === "membership" ? "Annual Fee" : "Registration Fee"}
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
                {isCngAvailable && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-green-800 mb-1">Secure Payment</p>
                        <p className="text-green-700">Powered by Cash N' Go. Your payment is secure.</p>
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
