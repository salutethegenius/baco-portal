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
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { useLocation } from "wouter";
import ObjectUploader from "@/components/ObjectUploader";
import { Award, Shield, FileText, Clock, Users, CheckCircle, XCircle, RotateCcw, Trash2 } from "lucide-react";
import RegistrationAdminEdit from "@/components/RegistrationAdminEdit";
import AdminMessagesTab from "@/components/AdminMessagesTab";
import CertificateTemplateUploader from "@/components/CertificateTemplateUploader";
import CertificateGenerator from "@/components/CertificateGenerator";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import AdminInvoicesTab from "@/components/AdminInvoicesTab";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().optional(),
  price: z.coerce.number().min(0),
  maxAttendees: z.coerce.number().min(1),
  registrationClosed: z.boolean().optional().default(false),
});

type EventFormData = z.infer<typeof eventSchema>;

// Compliance Dashboard Components
function AuditLogViewer() {
  const [eventFilter, setEventFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data: auditLogs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/audit-logs", eventFilter, startDate, endDate, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (eventFilter) params.append("event", eventFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("limit", limit.toString());
      params.append("offset", (page * limit).toString());
      const response = await apiRequest("GET", `/api/admin/audit-logs?${params}`);
      return response.json();
    },
  });

  const eventTypes = [
    "privacy.myData.downloaded",
    "privacy.correction.requested",
    "privacy.deletion.requested",
    "event.deleted",
    "event.registrations.exported",
    "document.status.updated",
    "user.adminStatus.updated",
    "user.deleted",
    "user.deactivated",
    "retention.purge.executed",
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Events</SelectItem>
            {eventTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-[180px]"
        />
        <Input
          type="date"
          placeholder="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-[180px]"
        />
      </div>
      {isLoading ? (
        <div className="text-center py-8">Loading audit logs...</div>
      ) : auditLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No audit logs found</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Target User ID</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.createdAt), "PPpp")}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.event}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.userId || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{log.targetUserId || "-"}</TableCell>
                  <TableCell className="max-w-md">
                    <pre className="text-xs overflow-auto">{log.details || "{}"}</pre>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.ipAddress || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex justify-between items-center">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <span className="text-sm text-gray-500">Page {page + 1}</span>
        <Button variant="outline" disabled={auditLogs.length < limit} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function DataSubjectRequestsTracker() {
  const { data: dsrRequests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/dsr-requests"],
  });
  const { toast } = useToast();

  if (isLoading) {
    return <div className="text-center py-8">Loading data subject requests...</div>;
  }

  if (dsrRequests.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data subject requests found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dsrRequests.map((msg: any) => (
            <TableRow key={msg.id}>
              <TableCell>{msg.fromUser?.email || msg.fromUserId}</TableCell>
              <TableCell>{msg.subject || "No subject"}</TableCell>
              <TableCell>{format(new Date(msg.sentAt), "PPp")}</TableCell>
              <TableCell>
                <Badge variant={msg.isRead ? "default" : "destructive"}>
                  {msg.isRead ? "Resolved" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "View Message",
                      description: "Open Messages tab to view full conversation",
                    });
                  }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RetentionDashboard() {
  const { data: stats, isLoading } = useQuery<{
    active: number;
    softDeleted: number;
    anonymized: number;
    upcomingPurge: number;
  }>({
    queryKey: ["/api/admin/retention/stats"],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const purgeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/retention/purge");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purge Completed",
        description: `Purged ${data.stats.usersSoftDeleted} users, ${data.stats.eventRegistrationsDeleted} registrations, and more.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/retention/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Purge Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading retention stats...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Soft-Deleted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.softDeleted || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Anonymized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.anonymized || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Purge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingPurge || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Candidates</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm("Are you sure you want to run the retention purge? This will soft-delete inactive users and remove old data.")) {
              purgeMutation.mutate();
            }
          }}
          disabled={purgeMutation.isPending}
        >
          {purgeMutation.isPending ? "Running..." : "Run Manual Purge"}
        </Button>
      </div>
    </div>
  );
}

function ConsentOverview() {
  const { data: stats, isLoading } = useQuery<{ optedIn: number; optedOut: number }>({
    queryKey: ["/api/admin/consent-stats"],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading consent stats...</div>;
  }

  const total = (stats?.optedIn || 0) + (stats?.optedOut || 0);
  const optedInPercent = total > 0 ? Math.round(((stats?.optedIn || 0) / total) * 100) : 0;
  const optedOutPercent = total > 0 ? Math.round(((stats?.optedOut || 0) / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Opted In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.optedIn || 0}</div>
            <div className="text-sm text-gray-500">{optedInPercent}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Opted Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.optedOut || 0}</div>
            <div className="text-sm text-gray-500">{optedOutPercent}%</div>
          </CardContent>
        </Card>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-green-600 h-4 rounded-full transition-all"
          style={{ width: `${optedInPercent}%` }}
        />
      </div>
    </div>
  );
}

function DeactivatedUsersList() {
  const { data: deletedUsers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users/deleted"],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/restore`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Restored",
        description: "User account has been restored successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading deactivated users...</div>;
  }

  if (deletedUsers.length === 0) {
    return <div className="text-center py-8 text-gray-500">No deactivated users found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Deactivated</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deletedUsers.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell>
                {user.deletedAt ? format(new Date(user.deletedAt), "PPp") : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={user.firstName === "Deleted" ? "destructive" : "secondary"}>
                  {user.firstName === "Deleted" ? "Anonymized" : "Soft-Deleted"}
                </Badge>
              </TableCell>
              <TableCell>
                {user.firstName !== "Deleted" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Restore account for ${user.email}?`)) {
                        restoreMutation.mutate(user.id);
                      }
                    }}
                    disabled={restoreMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [viewRegistrationsDialogOpen, setViewRegistrationsDialogOpen] = useState(false);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<any>(null);
  const [editingRegistration, setEditingRegistration] = useState<any>(null);
  const [editRegistrationDialogOpen, setEditRegistrationDialogOpen] = useState(false);
  

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !(user as any)?.isAdmin)) {
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

  const { data: stats } = useQuery<{totalMembers: number; activeMembers: number; pendingDocuments: number}>({
    queryKey: ["/api/admin/stats"],
    enabled: !!(user as any)?.isAdmin,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!(user as any)?.isAdmin,
  });

  const { data: detailedUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users/detailed"],
    enabled: !!(user as any)?.isAdmin,
  });

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ["/api/documents/my"], // Admin should see all documents
    enabled: !!(user as any)?.isAdmin,
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events"],
    enabled: !!(user as any)?.isAdmin,
  });

  const { data: eventRegistrations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/events", selectedEventForRegistrations?.id, "registrations"],
    enabled: !!(user as any)?.isAdmin && !!selectedEventForRegistrations?.id,
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      price: 0,
      maxAttendees: 50,
      registrationClosed: false,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const eventData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      const response = await apiRequest("POST", "/api/events", eventData);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create event: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
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

  const handleSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventFormData }) => {
      const eventData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      const response = await apiRequest("PUT", `/api/events/${id}`, eventData);
      return await response.json();
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
      price: parseFloat(event.price) || 0,
      maxAttendees: event.maxAttendees || 50,
      registrationClosed: event.registrationClosed || false,
    });
    setEditEventDialogOpen(true);
  };

  const handleEditSubmit = (data: EventFormData) => {
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data });
    }
  };

  const handleViewRegistrations = (event: any) => {
    setSelectedEventForRegistrations(event);
    setViewRegistrationsDialogOpen(true);
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

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/detailed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "Member deleted successfully",
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

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${userName}" from the member list? This action cannot be undone and will remove all their data including registrations, documents, messages, and payments.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

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

  if (!(user as any)?.isAdmin) {
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
            <TabsTrigger value="landing-pages" data-testid="tab-landing-pages">Event Landing Pages</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
            <TabsTrigger value="certificates" data-testid="tab-certificates">Certificates</TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
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
                                      {member.isAdmin && member.id !== (user as any)?.id && (
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
                              {member.isAdmin && member.id !== (user as any)?.id && (
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
                              {member.id !== (user as any)?.id && (
                                <Button
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDeleteUser(member.id, `${member.firstName} ${member.lastName}`)}
                                  disabled={deleteUserMutation.isPending}
                                  data-testid={`button-delete-member-${member.id}`}
                                >
                                  Delete Member
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
                                  <FormLabel>Maximum Attendees</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      min="1"
                                      data-testid="input-max-attendees" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                          </div>

                          <FormField
                            control={form.control}
                            name="registrationClosed"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Close Registration</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Prevent new registrations for this event
                                  </div>
                                </div>
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                    className="h-4 w-4"
                                    data-testid="checkbox-registration-closed"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

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
                                  <FormLabel>Maximum Attendees</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      min="1"
                                      data-testid="input-edit-event-max-attendees" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="registrationClosed"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Close Registration</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Prevent new registrations for this event
                                  </div>
                                </div>
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                    className="h-4 w-4"
                                    data-testid="checkbox-edit-registration-closed"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

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

                  {/* View Registrations Dialog */}
                  <Dialog open={viewRegistrationsDialogOpen} onOpenChange={setViewRegistrationsDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Event Registrations - {selectedEventForRegistrations?.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                          Total Registrations: {eventRegistrations.length}
                        </div>
                        {eventRegistrations.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Company</TableHead>
                                  <TableHead>Registration Type</TableHead>
                                  <TableHead>Paid</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {eventRegistrations.map((registration: any) => (
                                  <TableRow key={registration.id}>
                                    <TableCell className="font-medium">
                                      {registration.firstName} {registration.lastName}
                                    </TableCell>
                                    <TableCell>{registration.email}</TableCell>
                                    <TableCell>{registration.companyName || 'N/A'}</TableCell>
                                    <TableCell className="capitalize">
                                      {registration.registrationType?.replace(/_/g, ' ') || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      {registration.isPaid ? (
                                        <Badge className="bg-green-600">Paid</Badge>
                                      ) : (
                                        <Badge variant="outline">Pending</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {registration.paymentAmount ? `$${registration.paymentAmount}` : 'Free'}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingRegistration(registration);
                                          setEditRegistrationDialogOpen(true);
                                        }}
                                        data-testid={`button-manage-${registration.id}`}
                                      >
                                        Manage
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Registrations Yet</h3>
                            <p className="text-gray-500">This event doesn't have any registrations.</p>
                          </div>
                        )}
                        <div className="flex justify-between pt-4 border-t">
                          <Button
                            variant="default"
                            onClick={() => {
                              const eventId = selectedEventForRegistrations?.id;
                              if (!eventId) return;
                              
                              const reason = window.prompt(
                                "Please enter a short reason for exporting this registration list (for audit purposes):"
                              );
                              if (!reason) {
                                return;
                              }

                              const url = `/api/admin/events/${eventId}/registrations/export?reason=${encodeURIComponent(
                                reason
                              )}`;
                              window.location.href = url;
                            }}
                            disabled={eventRegistrations.length === 0}
                            data-testid="button-export-csv"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Export CSV
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setViewRegistrationsDialogOpen(false);
                              setSelectedEventForRegistrations(null);
                            }}
                            data-testid="button-close-registrations"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Registration Admin Edit Dialog */}
                  {editingRegistration && (
                    <RegistrationAdminEdit
                      registration={editingRegistration}
                      event={selectedEventForRegistrations}
                      open={editRegistrationDialogOpen}
                      onClose={() => {
                        setEditRegistrationDialogOpen(false);
                        setEditingRegistration(null);
                      }}
                    />
                  )}
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
                              {event.slug && (
                                <QRCodeGenerator 
                                  eventId={event.id}
                                  eventTitle={event.title}
                                  eventSlug={event.slug}
                                />
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewRegistrations(event)}
                                data-testid={`button-view-registrations-${event.id}`}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              >
                                View Registrations
                              </Button>
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

          <TabsContent value="landing-pages">
            <Card>
              <CardHeader>
                <CardTitle>Event Landing Pages</CardTitle>
                <p className="text-sm text-gray-600">Manage dedicated landing pages for special events with QR code generation</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* BACO Conference 2025 */}
                  <div className="border rounded-lg p-6 bg-gradient-to-r from-gold-50 to-yellow-50 border-gold-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center">
                          <Award className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">BACO Conference 2025</h3>
                          <p className="text-sm text-gray-600">25th Anniversary Celebration</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">/baco-conference-2025</code>
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Event Dates:</strong> November 13-14, 2025
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Venue:</strong> Grand Hyatt Baha Mar, Nassau
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/baco-conference-2025', '_blank')}
                        className="bg-white hover:bg-gray-50"
                      >
                        <i className="fas fa-external-link-alt mr-2 text-xs"></i>
                        View Landing Page
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Generate QR code for the landing page
                          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/baco-conference-2025')}`;
                          window.open(qrCodeUrl, '_blank');
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      >
                        <i className="fas fa-qrcode mr-2 text-xs"></i>
                        Generate QR Code
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/seed-baco-conference-2025', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                            });
                            const result = await response.json();
                            if (response.ok) {
                              toast({
                                title: "Success",
                                description: "BACO Conference 2025 event seeded successfully!",
                              });
                              queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                            } else {
                              toast({
                                title: "Error",
                                description: result.message,
                                variant: "destructive",
                              });
                            }
                          } catch {
                            toast({
                              title: "Error",
                              description: "Failed to seed event",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      >
                        <i className="fas fa-database mr-2 text-xs"></i>
                        Seed Event in Database
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/baco-conference-2025');
                          toast({
                            title: "Copied!",
                            description: "Landing page URL copied to clipboard",
                          });
                        }}
                        className="bg-gray-50 hover:bg-gray-100"
                      >
                        <i className="fas fa-copy mr-2 text-xs"></i>
                        Copy URL
                      </Button>
                    </div>
                  </div>

                  {/* Placeholder for future landing pages */}
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-plus text-gray-400 text-xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Landing Page</h3>
                    <p className="text-gray-500 mb-4">
                      Design custom landing pages for special events and conferences
                    </p>
                    <Button variant="outline" disabled>
                      <i className="fas fa-plus mr-2"></i>
                      Coming Soon
                    </Button>
                  </div>
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

          <TabsContent value="certificates">
            <div className="space-y-8">
              <CertificateGenerator />
              <CertificateTemplateUploader />
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-8">
              <InvoiceGenerator />
              <AdminInvoicesTab />
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <AdminMessagesTab />
          </TabsContent>

          <TabsContent value="compliance">
            <div className="space-y-6">
              {/* Audit Log Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Audit Log Viewer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AuditLogViewer />
                </CardContent>
              </Card>

              {/* Data Subject Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Data Subject Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DataSubjectRequestsTracker />
                </CardContent>
              </Card>

              {/* Retention Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Retention Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RetentionDashboard />
                </CardContent>
              </Card>

              {/* Consent Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Consent Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConsentOverview />
                </CardContent>
              </Card>

              {/* Deactivated Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Deactivated Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DeactivatedUsersList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}