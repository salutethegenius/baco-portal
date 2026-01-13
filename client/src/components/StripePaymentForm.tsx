import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2, CreditCard, Lock } from "lucide-react";

interface StripePaymentFormProps {
  clientSecret: string;
  amount: string;
  description: string;
  type: "membership" | "event";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function StripePaymentForm({
  clientSecret,
  amount,
  description,
  type,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        onError?.(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm payment on the backend
        await apiRequest("POST", "/api/confirm-payment", {
          paymentIntentId: paymentIntent.id,
        });

        setPaymentSuccess(true);
        toast({
          title: "Payment Successful!",
          description: "Your payment has been processed successfully.",
        });
        onSuccess?.();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      onError?.(err.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-600 mb-4">
          Thank you for your payment of ${amount} BSD.
        </p>
        <p className="text-sm text-gray-500">
          A confirmation email will be sent to your registered email address.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element Container */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <CreditCard className="h-4 w-4" />
          <span>Enter your card details</span>
        </div>
        
        {/* Loading state while Stripe loads */}
        {!isElementReady && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading payment form...</span>
            </div>
          </div>
        )}
        
        {/* Stripe PaymentElement */}
        <div className={!isElementReady ? "hidden" : ""}>
          <PaymentElement
            onReady={() => setIsElementReady(true)}
            options={{
              layout: {
                type: "accordion",
                defaultCollapsed: false,
                radios: false,
                spacedAccordionItems: true,
              },
            }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing || !isElementReady}
        className="w-full bg-baco-primary hover:bg-baco-secondary disabled:bg-gray-400"
        data-testid="button-pay-now"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing payment...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Pay ${amount} BSD
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        <span>Secured by Stripe. Your card details are encrypted.</span>
      </div>

      {/* Test mode indicator */}
      {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test") && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 font-medium mb-1">🧪 Test Mode</p>
          <p className="text-xs text-yellow-700">
            Use test card: <code className="bg-yellow-100 px-1 py-0.5 rounded font-mono">4242 4242 4242 4242</code>
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Expiry: any future date • CVC: any 3 digits • ZIP: any
          </p>
        </div>
      )}
    </form>
  );
}
