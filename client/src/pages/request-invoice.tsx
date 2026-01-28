import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";

const invoiceRequestSchema = z.object({
  placeOfEmployment: z.string().optional(),
  companyName: z.string().optional(),
  companyEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
});

type InvoiceRequestFormData = z.infer<typeof invoiceRequestSchema>;

export default function RequestInvoice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const form = useForm<InvoiceRequestFormData>({
    resolver: zodResolver(invoiceRequestSchema),
    defaultValues: {
      placeOfEmployment: (user as any)?.currentEmployer || "",
      companyName: (user as any)?.company || "",
      companyEmail: "",
      amount: 0,
      description: "BACO Membership Services",
    },
  });

  const requestInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceRequestFormData) => {
      const response = await apiRequest("POST", "/api/invoices/request", {
        placeOfEmployment: data.placeOfEmployment || undefined,
        companyName: data.companyName || undefined,
        companyEmail: data.companyEmail || undefined,
        amount: data.amount,
        description: data.description,
      });

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice Generated",
        description: "Your invoice has been generated and sent to your email and company email (if provided).",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/my"] });
      form.reset();
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InvoiceRequestFormData) => {
    requestInvoiceMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-file-invoice text-baco-primary"></i>
              Request Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Fill in the details below to generate and receive a BACO-branded invoice. 
              The invoice will be automatically sent to your email and your company email (if provided).
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Member Information:</strong> {user ? `${(user as any).firstName} ${(user as any).lastName}` : ""} ({user ? (user as any).email : ""})
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="placeOfEmployment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place of Employment</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="Optional - invoice will be CC'd to this email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (BSD)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    disabled={requestInvoiceMutation.isPending}
                    className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                  >
                    {requestInvoiceMutation.isPending ? "Generating..." : "Generate & Send Invoice"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
