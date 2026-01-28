import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: payments = [] } = useQuery<any[]>({
    queryKey: ["/api/payments/my"],
  });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      marketingOptIn: user?.marketingOptIn ?? true,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const response = await apiRequest("PUT", "/api/users/me", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      marketingOptIn: user?.marketingOptIn ?? true,
    });
    setIsEditing(false);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "failed":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    }
  };

  const ChangePasswordForm = () => {
    const passwordForm = useForm<ChangePasswordFormData>({
      resolver: zodResolver(changePasswordSchema),
      defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    });

    const changePasswordMutation = useMutation({
      mutationFn: async (data: ChangePasswordFormData) => {
        const response = await apiRequest("POST", "/api/auth/change-password", {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to change password");
        }
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Password Changed",
          description: "Your password has been changed successfully.",
        });
        passwordForm.reset();
      },
      onError: (error: Error) => {
        toast({
          title: "Change Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });

    const handlePasswordSubmit = (data: ChangePasswordFormData) => {
      changePasswordMutation.mutate(data);
    };

    return (
      <Form {...passwordForm}>
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
          <FormField
            control={passwordForm.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    {...field}
                    data-testid="input-current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={passwordForm.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter new password (min. 8 characters)"
                    {...field}
                    data-testid="input-new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={passwordForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    {...field}
                    data-testid="input-confirm-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="bg-baco-primary hover:bg-baco-secondary"
            data-testid="button-change-password"
          >
            {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </Form>
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">
            Manage your account information and view your membership details.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" data-testid="tab-profile">Profile Information</TabsTrigger>
            <TabsTrigger value="password" data-testid="tab-password">Change Password</TabsTrigger>
            <TabsTrigger value="membership" data-testid="tab-membership">Membership</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payment History</TabsTrigger>
            <TabsTrigger value="privacy" data-testid="tab-privacy">Account & Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-edit-profile"
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., +1 (242) 123-4567" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Enter your address" data-testid="textarea-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-4">
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="bg-baco-primary hover:bg-baco-secondary"
                          data-testid="button-save-profile"
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          data-testid="button-cancel-edit"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500">First Name</label>
                        <p className="text-gray-900" data-testid="text-first-name">
                          {user?.firstName || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Name</label>
                        <p className="text-gray-900" data-testid="text-last-name">
                          {user?.lastName || "Not provided"}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <p className="text-gray-900" data-testid="text-email">
                        {user?.email || "Not provided"}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="text-gray-900" data-testid="text-phone">
                        {user?.phone || "Not provided"}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900" data-testid="text-address">
                        {user?.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <ChangePasswordForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membership">
            <Card>
              <CardHeader>
                <CardTitle>Membership Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member ID</label>
                    <p className="text-gray-900 font-mono" data-testid="text-member-id">
                      BACO-{new Date(user?.createdAt || '').getFullYear()}-{user?.id?.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Membership Status</label>
                    <div className="mt-1">
                      <Badge 
                        className={
                          user?.membershipStatus === 'active' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        }
                        data-testid="badge-membership-status"
                      >
                        {user?.membershipStatus ? user.membershipStatus.charAt(0).toUpperCase() + user.membershipStatus.slice(1) : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Join Date</label>
                    <p className="text-gray-900" data-testid="text-join-date">
                      {user?.joinDate ? format(new Date(user.joinDate), 'MMMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Membership Type</label>
                    <p className="text-gray-900 capitalize" data-testid="text-membership-type">
                      {user?.membershipType || 'Professional'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Annual Fee</label>
                    <p className="text-gray-900" data-testid="text-annual-fee">
                      ${user?.annualFee || '350.00'} BSD
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Next Payment Due</label>
                    <p className="text-gray-900" data-testid="text-next-payment">
                      {user?.nextPaymentDate ? format(new Date(user.nextPaymentDate), 'MMMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment: any) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900" data-testid={`text-payment-description-${payment.id}`}>
                              {payment.description || `${payment.type.charAt(0).toUpperCase() + payment.type.slice(1)} Payment`}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {format(new Date(payment.paymentDate), 'MMMM dd, yyyy')} • {payment.currency}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900" data-testid={`text-payment-amount-${payment.id}`}>
                              ${payment.amount}
                            </p>
                            <Badge 
                              className={getPaymentStatusColor(payment.status)}
                              data-testid={`badge-payment-status-${payment.id}`}
                            >
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="fas fa-receipt text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                    <p className="text-gray-500">Your payment history will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Account & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Marketing preferences</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Control whether BACO may send you occasional updates about events, trainings and membership news.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      id="marketingOptIn"
                      type="checkbox"
                      checked={!!form.watch("marketingOptIn")}
                      onChange={(e) => form.setValue("marketingOptIn", e.target.checked)}
                      className="h-4 w-4"
                      data-testid="checkbox-marketing-opt-in"
                    />
                    <label htmlFor="marketingOptIn" className="text-sm text-gray-800 cursor-pointer">
                      I would like to receive BACO updates and event information by email.
                    </label>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Download your data</h3>
                  <p className="text-xs text-gray-600">
                    Get a machine-readable copy of your core account, event, payment and document information as stored in the portal.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await apiRequest("GET", "/api/privacy/my-data");
                        if (!response.ok) {
                          throw new Error("Failed to generate data export");
                        }
                        const data = await response.json();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "baco-account-data.json";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      } catch (error: any) {
                        toast({
                          title: "Export Failed",
                          description: error.message || "Could not download your data.",
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid="button-download-my-data"
                  >
                    Download my data
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Request data correction</h3>
                  <p className="text-xs text-gray-600">
                    If you see information that you cannot change yourself and believe it is inaccurate, you can ask BACO to correct it.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const details = window.prompt(
                        "Please describe what needs to be corrected (for example, which field and the correct value)."
                      );
                      if (!details) return;
                      try {
                        const response = await apiRequest("POST", "/api/privacy/request-correction", { details });
                        if (!response.ok) {
                          const error = await response.json().catch(() => null);
                          throw new Error(error?.message || "Failed to submit correction request");
                        }
                        toast({
                          title: "Request submitted",
                          description: "Your correction request has been sent to BACO.",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Request Failed",
                          description: error.message || "Could not submit your request.",
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid="button-request-correction"
                  >
                    Request a correction
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Request account deletion/deactivation</h3>
                  <p className="text-xs text-gray-600">
                    You may ask BACO to deactivate or delete your account. Some records (for example invoices) may need to be kept for legal or audit reasons.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      const confirm = window.confirm(
                        "This will send a request to BACO to deactivate or delete your account. BACO will review and respond.\n\nDo you want to continue?"
                      );
                      if (!confirm) return;
                      const reason = window.prompt("Optionally, provide a reason or additional context for your request:");
                      try {
                        const response = await apiRequest("POST", "/api/privacy/request-deletion", { reason });
                        if (!response.ok) {
                          const error = await response.json().catch(() => null);
                          throw new Error(error?.message || "Failed to submit deletion request");
                        }
                        toast({
                          title: "Request submitted",
                          description:
                            "Your request has been sent to BACO. They may contact you if they need more information.",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Request Failed",
                          description: error.message || "Could not submit your request.",
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid="button-request-deletion"
                  >
                    Request account deletion/deactivation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
