import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Loader2, ExternalLink, Copy } from "lucide-react";

export default function TestPayment() {
  const { user, isAuthenticated } = useAuth();
  const [amount, setAmount] = useState("5.00");
  const [type, setType] = useState("membership");
  const [description, setDescription] = useState("Test Payment");
  const [result, setResult] = useState<{ redirectUrl?: string; orderNumber?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: cngStatus, isLoading: statusLoading } = useQuery<{ available: boolean }>({
    queryKey: ["/api/cng/status"],
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: { amount: number; type: string; description: string }) => {
      const response = await apiRequest("POST", "/api/cng/create-payment", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      setResult({ error: error.message });
    },
  });

  const handleCreatePayment = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      setResult({ error: "Amount must be at least 1.00" });
      return;
    }
    setResult(null);
    createPaymentMutation.mutate({
      amount: amountNum,
      type,
      description,
    });
  };

  const handleCopyUrl = () => {
    if (result?.redirectUrl) {
      navigator.clipboard.writeText(result.redirectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenInNewTab = () => {
    if (result?.redirectUrl) {
      window.open(result.redirectUrl, "_blank");
    }
  };

  const handleRedirect = () => {
    if (result?.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">CNG Payment Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">Please log in to test payments.</p>
            <Button className="w-full mt-4" onClick={() => window.location.href = "/auth"}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              CNG Payment Test Page
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard"}>
                Back to Dashboard
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This is a standalone test page for CNG payment generation. Use it to test the payment flow without affecting the main checkout.
            </p>
            <p className="text-sm text-gray-500">
              Logged in as: <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
            </p>
          </CardContent>
        </Card>

        {/* CNG Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CNG Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking CNG availability...
              </div>
            ) : cngStatus?.available ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                CNG is available and configured
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                CNG is not configured (check CNG_AUTH_ID and CNG_API_KEY in .env)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Test Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (BSD)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Payment Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Test Payment"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreatePayment}
              disabled={!cngStatus?.available || createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Payment...
                </>
              ) : (
                "Create Payment (API Call Only)"
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              This calls POST /api/cng/create-payment and returns the redirect URL without redirecting.
            </p>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className={result.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {result.error ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    Error
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Payment Created
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.error ? (
                <p className="text-red-700">{result.error}</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Order Number</Label>
                    <p className="font-mono text-sm bg-white p-2 rounded border">{result.orderNumber}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Redirect URL</Label>
                    <div className="bg-white p-2 rounded border overflow-x-auto">
                      <code className="text-xs break-all">{result.redirectUrl}</code>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? "Copied!" : "Copy URL"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open in New Tab
                    </Button>
                    <Button size="sm" onClick={handleRedirect}>
                      Redirect to CNG
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Click "Redirect to CNG" to go to the payment page, or "Open in New Tab" to view without leaving this page.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Callback Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Callback Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>When CNG completes/cancels, it redirects to:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs">
              {window.location.origin}/api/cng/callback
            </code>
            <p className="mt-2">
              CNG should append <code>?ORDER_NUMBER=...&STATUS=PAID</code> (or <code>STATUS=CANCELLED</code>).
            </p>
            <p>
              If CNG returns with no query params (sandbox quirk), we recover the order from session and show "verification pending".
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
