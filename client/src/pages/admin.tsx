import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { format } from "date-fns";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().optional(),
  price: z.string().transform((val) => parseFloat(val) || 0),
  maxAttendees: z.string().transform((val) => parseInt(val) || 0),
});

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user?.isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  const { data: detailedUsers = [] } = useQuery({
    queryKey: ["/api/admin/users/detailed"],
    enabled: !!user?.isAdmin,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents/my"], // Admin should see all documents
    enabled: !!user?.isAdmin,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
    enabled: !!user?.isAdmin,
  });

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      price: "0",
      maxAttendees: "50",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof eventSchema>) => {
      const response = await apiRequest("POST", "/api/events", {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "The event has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setCreateEventDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Your session has expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
        return;
      }
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDocumentStatusMutation = useMutation({
    mutationFn: async ({ documentId, status }: { documentId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/documents/${documentId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Updated",
        description: "Document status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/my"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof eventSchema>) => {
    createEventMutation.mutate(data);
  };

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof eventSchema> }) => {
      const response = await apiRequest("PUT", `/api/events/${id}`, {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Updated",
        description: "The event has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditEventDialogOpen(false);
      setEditingEvent(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    // Format dates for datetime-local input
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    form.reset({
      title: event.title,
      description: event.description,
      startDate: startDate.toISOString().slice(0, 16),
      endDate: endDate.toISOString().slice(0, 16),
      location: event.location || "",
      price: event.price.toString(),
      maxAttendees: event.maxAttendees?.toString() || "50",
    });
    setEditEventDialogOpen(true);
  };

  const handleEditSubmit = (data: z.infer<typeof eventSchema>) => {
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data });
    }
  };

  const updateAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      return await apiRequest("PUT", `/api/admin/users/${userId}/admin-status`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/detailed"] });
      toast({
        title: "Success",
        description: "Admin status updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "approved":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  if (!user?.isAdmin) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <i className="fas fa-lock text-gray-400 text-4xl mb-4"></i>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600">This page is only accessible to administrators.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage members, events, and platform settings.</p>
          </div>
        </div>

        {/* Admin Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-baco-primary/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-baco-primary"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-members">
                      {stats.totalMembers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-baco-success/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check text-baco-success"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Members</p>
                    <p className="text-2xl font-bold text-gray-900" data-testid="stat-active-members">
                      {stats.activeMembers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-file-alt text-yellow-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Documents</p>
                    <p className="text-2xl font-bold text-gray-900" data-testid="stat-pending-documents">
                      {stats.pendingDocuments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">Members</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Member Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((member: any) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium" data-testid={`member-name-${member.id}`}>
                            {member.firstName} {member.lastName}
                          </TableCell>
                          <TableCell data-testid={`member-email-${member.id}`}>
                            {member.email}
                          </TableCell>
                          <TableCell>
                            {member.joinDate ? format(new Date(member.joinDate), 'MMM d, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={getStatusColor(member.membershipStatus)}
                              data-testid={`member-status-${member.id}`}
                            >
                              {member.membershipStatus?.charAt(0).toUpperCase() + member.membershipStatus?.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={member.isAdmin ? "bg-purple-100 text-purple-800 hover:bg-purple-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}
                              data-testid={`member-role-${member.id}`}
                            >
                              {member.isAdmin ? "Admin" : "Member"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" data-testid={`button-view-member-${member.id}`}>
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Member Details</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Name:</strong> {member.firstName} {member.lastName}
                                      </div>
                                      <div>
                                        <strong>Email:</strong> {member.email}
                                      </div>
                                      <div>
                                        <strong>Join Date:</strong> {member.joinDate ? format(new Date(member.joinDate), 'MMM d, yyyy') : 'N/A'}
                                      </div>
                                      <div>
                                        <strong>Status:</strong> 
                                        <Badge className={`ml-2 ${getStatusColor(member.membershipStatus)}`}>
                                          {member.membershipStatus?.charAt(0).toUpperCase() + member.membershipStatus?.slice(1)}
                                        </Badge>
                                      </div>
                                      <div>
                                        <strong>Role:</strong> 
                                        <Badge className={`ml-2 ${member.isAdmin ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
                                          {member.isAdmin ? "Admin" : "Member"}
                                        </Badge>
                                      </div>
                                      <div>
                                        <strong>Membership Type:</strong> {member.membershipType || 'N/A'}
                                      </div>
                                      {member.phone && (
                                        <div>
                                          <strong>Phone:</strong> {member.phone}
                                        </div>
                                      )}
                                      {member.address && (
                                        <div className="col-span-2">
                                          <strong>Address:</strong> {member.address}
                                        </div>
                                      )}
                                      {member.annualFee && (
                                        <div>
                                          <strong>Annual Fee:</strong> ${member.annualFee}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex gap-2 pt-4 border-t">
                                      {!member.isAdmin && (
                                        <Button
                                          variant="default" 
                                          size="sm"
                                          onClick={() => updateAdminStatusMutation.mutate({ userId: member.id, isAdmin: true })}
                                          disabled={updateAdminStatusMutation.isPending}
                                        >
                                          Grant Admin Access
                                        </Button>
                                      )}
                                      {member.isAdmin && member.id !== user?.id && (
                                        <Button
                                          variant="destructive" 
                                          size="sm"
                                          onClick={() => updateAdminStatusMutation.mutate({ userId: member.id, isAdmin: false })}
                                          disabled={updateAdminStatusMutation.isPending}
                                        >
                                          Remove Admin Access
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              {!member.isAdmin && (
                                <Button
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateAdminStatusMutation.mutate({ userId: member.id, isAdmin: true })}
                                  disabled={updateAdminStatusMutation.isPending}
                                  data-testid={`button-make-admin-${member.id}`}
                                >
                                  Make Admin
                                </Button>
                              )}
                              {member.isAdmin && member.id !== user?.id && (
                                <Button
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateAdminStatusMutation.mutate({ userId: member.id, isAdmin: false })}
                                  disabled={updateAdminStatusMutation.isPending}
                                  data-testid={`button-remove-admin-${member.id}`}
                                >
                                  Remove Admin
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Event Management</CardTitle>
                  <Dialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-baco-primary hover:bg-baco-secondary"
                        data-testid="button-create-event"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Create Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Title</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-event-title" />
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
                                  <Textarea {...field} data-testid="textarea-event-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date & Time</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="datetime-local" 
                                      {...field} 
                                      data-testid="input-event-start-date"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date & Time</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="datetime-local" 
                                      {...field} 
                                      data-testid="input-event-end-date"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-event-location" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (BSD)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      {...field} 
                                      data-testid="input-event-price"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="maxAttendees"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Attendees</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      data-testid="input-event-max-attendees"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex space-x-4">
                            <Button
                              type="submit"
                              disabled={createEventMutation.isPending}
                              className="bg-baco-primary hover:bg-baco-secondary"
                              data-testid="button-submit-create-event"
                            >
                              {createEventMutation.isPending ? "Creating..." : "Create Event"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCreateEventDialogOpen(false)}
                              data-testid="button-cancel-create-event"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Event Dialog */}
                  <Dialog open={editEventDialogOpen} onOpenChange={setEditEventDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Edit Event</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Title</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-edit-event-title" />
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
                                  <Textarea {...field} data-testid="textarea-edit-event-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date & Time</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="datetime-local" 
                                      {...field} 
                                      data-testid="input-edit-event-start-date"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date & Time</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="datetime-local" 
                                      {...field} 
                                      data-testid="input-edit-event-end-date"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-edit-event-location" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (BSD)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      {...field} 
                                      data-testid="input-edit-event-price"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="maxAttendees"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Attendees</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      data-testid="input-edit-event-max-attendees"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex space-x-4">
                            <Button
                              type="submit"
                              disabled={updateEventMutation.isPending}
                              className="bg-baco-primary hover:bg-baco-secondary"
                              data-testid="button-submit-edit-event"
                            >
                              {updateEventMutation.isPending ? "Updating..." : "Update Event"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditEventDialogOpen(false);
                                setEditingEvent(null);
                                form.reset();
                              }}
                              data-testid="button-cancel-edit-event"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Attendees</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event: any) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium" data-testid={`event-title-${event.id}`}>
                            {event.title}
                          </TableCell>
                          <TableCell>
                            {format(new Date(event.startDate), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>{event.location || 'TBA'}</TableCell>
                          <TableCell>
                            {event.price > 0 ? `$${event.price} BSD` : 'Free'}
                          </TableCell>
                          <TableCell>
                            {event.currentAttendees || 0} / {event.maxAttendees || '∞'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2 flex-wrap gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate(`/event/${event.id}`)}
                                data-testid={`button-view-page-${event.id}`}
                              >
                                Internal
                              </Button>
                              {event.slug && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => window.open(`/events/${event.slug}`, '_blank')}
                                  data-testid={`button-view-public-event-${event.id}`}
                                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                >
                                  Public Page
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditEvent(event)}
                                data-testid={`button-edit-event-${event.id}`}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                disabled={deleteEventMutation.isPending}
                                data-testid={`button-delete-event-${event.id}`}
                              >
                                {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((document: any) => (
                        <TableRow key={document.id}>
                          <TableCell className="font-medium" data-testid={`document-name-${document.id}`}>
                            {document.fileName}
                          </TableCell>
                          <TableCell>Member Name</TableCell>
                          <TableCell className="capitalize">{document.category}</TableCell>
                          <TableCell>
                            {format(new Date(document.uploadDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={getStatusColor(document.status)}
                              data-testid={`document-status-${document.id}`}
                            >
                              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(document.objectPath, '_blank')}
                                data-testid={`button-view-document-${document.id}`}
                              >
                                View
                              </Button>
                              {document.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:bg-green-50"
                                    onClick={() => updateDocumentStatusMutation.mutate({ 
                                      documentId: document.id, 
                                      status: "approved" 
                                    })}
                                    data-testid={`button-approve-document-${document.id}`}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => updateDocumentStatusMutation.mutate({ 
                                      documentId: document.id, 
                                      status: "rejected" 
                                    })}
                                    data-testid={`button-reject-document-${document.id}`}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
