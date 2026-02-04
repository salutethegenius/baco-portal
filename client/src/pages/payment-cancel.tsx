import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const error = params.get("error");

  const message =
    error === "missing_order"
      ? "Invalid return link: order reference was missing."
      : error === "unknown_order"
        ? "We could not find this payment. Please contact BACO if you completed a payment."
        : error === "verification_pending"
          ? "You were returned from the payment provider, but we couldn't confirm the result. If you completed payment, your account will be updated shortly. Otherwise, no charges were made."
          : error === "unknown_status"
            ? "Payment status could not be determined."
            : error === "server_error"
              ? "A server error occurred. Please try again or contact BACO."
              : "Your payment was cancelled or could not be completed. No charges were made.";

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-amber-600" />
            </div>
            <CardTitle className="text-center text-2xl">Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">{message}</p>
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/checkout/membership">
                <Button className="w-full">Try Again (Membership)</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">Go to Dashboard</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
