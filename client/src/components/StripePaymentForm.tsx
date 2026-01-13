import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2 } from "lucide-react";

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
      <div className="p-4 bg-gray-50 rounded-lg mb-4">
        <p className="text-sm text-gray-600">
          <strong>Amount:</strong> ${amount} BSD
        </p>
        <p className="text-sm text-gray-600">
          <strong>Description:</strong> {description}
        </p>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-baco-primary hover:bg-baco-secondary"
        data-testid="button-pay-now"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${amount} BSD`
        )}
      </Button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Payments are securely processed by Stripe.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <img
            src="https://cdn.jsdelivr.net/gh/creativetimofficial/public-assets@master/logos/visa.jpg"
            alt="Visa"
            className="h-6"
          />
          <img
            src="https://cdn.jsdelivr.net/gh/creativetimofficial/public-assets@master/logos/mastercard.png"
            alt="Mastercard"
            className="h-6"
          />
          <img
            src="https://cdn.jsdelivr.net/gh/creativetimofficial/public-assets@master/logos/amex.png"
            alt="Amex"
            className="h-6"
          />
        </div>
      </div>

      {/* Test mode indicator */}
      {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test") && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 font-medium">Test Mode</p>
          <p className="text-xs text-yellow-700">
            Use card: <code className="bg-yellow-100 px-1">4242 4242 4242 4242</code>
            <br />
            Any future expiry, any CVC, any postal code.
          </p>
        </div>
      )}
    </form>
  );
}
