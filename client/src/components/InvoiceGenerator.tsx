import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const invoiceSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  memberName: z.string().min(1, "Member name is required"),
  memberEmail: z.string().email("Valid email is required"),
  placeOfEmployment: z.string().optional(),
  companyName: z.string().optional(),
  companyEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function InvoiceGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      memberId: "",
      memberName: "",
      memberEmail: "",
      placeOfEmployment: "",
      companyName: "",
      companyEmail: "",
      amount: 0,
      description: "BACO Membership Services",
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const response = await apiRequest("POST", "/api/admin/invoices/generate", {
        memberId: data.memberId,
        memberName: data.memberName,
        memberEmail: data.memberEmail,
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
        description: "Invoice has been generated and sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      setGenerateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InvoiceFormData) => {
    generateInvoiceMutation.mutate(data);
  };

  const selectedMember = users.find((u: any) => u.id === form.watch("memberId"));

  // Auto-fill member details when member is selected
  const handleMemberChange = (memberId: string) => {
    const member = users.find((u: any) => u.id === memberId);
    if (member) {
      form.setValue("memberId", memberId);
      form.setValue("memberName", `${member.firstName} ${member.lastName}`);
      form.setValue("memberEmail", member.email);
      form.setValue("placeOfEmployment", member.currentEmployer || "");
      form.setValue("companyName", member.company || "");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Generate Invoice</h2>
          <p className="text-gray-600">Generate and send BACO-branded invoices</p>
        </div>
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-baco-primary hover:bg-baco-secondary">
              <i className="fas fa-file-invoice mr-2"></i>
              Generate Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Member</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleMemberChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="memberName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="memberEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        <Input type="email" {...field} placeholder="Optional" />
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

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={generateInvoiceMutation.isPending}
                    className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                  >
                    {generateInvoiceMutation.isPending ? "Generating..." : "Generate & Send"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGenerateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
