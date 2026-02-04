import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import DashboardStats from "@/components/DashboardStats";
import EventCard from "@/components/EventCard";
import MessageCard from "@/components/MessageCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  price: string;
  maxAttendees: number;
  currentAttendees: number;
}

interface Message {
  id: string;
  subject: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Only fetch data if user is authenticated
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: !authLoading && !!user,
  });

  const { data: myRegistrations = [] } = useQuery<any[]>({
    queryKey: ["/api/event-registrations/my"],
    enabled: !authLoading && !!user,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/my"],
    enabled: !authLoading && !!user,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: !authLoading && !!user,
  });

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ["/api/documents/my"],
    enabled: !authLoading && !!user,
  });

  const { data: activity = [] } = useQuery<any[]>({
    queryKey: ["/api/activity/my"],
    enabled: !authLoading && !!user,
  });

  const upcomingEvents = events
    .filter((event) => new Date(event.startDate) > new Date())
    .slice(0, 3);

  // Filter messages to show only those FROM admin (received messages)
  const adminMessages = messages.filter((msg: any) => msg.fromUserId !== user?.id).slice(0, 3);
  
  // Calculate document counts
  const documentCounts = {
    approved: documents.filter((doc: any) => doc.status === 'approved').length,
    pending: documents.filter((doc: any) => doc.status === 'pending').length,
    rejected: documents.filter((doc: any) => doc.status === 'rejected').length,
  };
  const recentDocuments = documents.slice(0, 3);

  // Format activity dates
  const formatActivityDate = (date: string) => {
    const activityDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - activityDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return format(activityDate, 'MMM d, yyyy');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <DashboardStats user={user} unreadCount={unreadCount?.count || 0} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-calendar-alt text-baco-primary"></i>
                    Upcoming Events
                  </CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/events")}
                    className="text-baco-primary hover:text-baco-secondary"
                    data-testid="button-view-all-events"
                  >
                    View All Events
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event: any) => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No upcoming events</p>
                )}
                
                <Separator />
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/events")}
                    className="text-baco-primary hover:text-baco-secondary"
                    data-testid="button-view-past-events"
                  >
                    <i className="fas fa-history mr-2"></i>
                    View Past Events & Certificates
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-clock text-baco-primary"></i>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activity.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {activity.map((act, index) => (
                        <li key={act.id || index}>
                          <div className="relative pb-8">
                            {index !== activity.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full bg-${act.color} flex items-center justify-center ring-8 ring-white`}>
                                  <i className={`fas fa-${act.icon} text-white text-xs`}></i>
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{act.message}</p>
                                <p className="mt-0.5 text-xs text-gray-500">{formatActivityDate(act.timestamp || act.date)}</p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-gray-400 cursor-not-allowed"
                  disabled
                  data-testid="button-make-payment"
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  Payment Temporarily Unavailable
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-baco-primary text-baco-primary hover:bg-baco-primary hover:text-white"
                  onClick={() => navigate("/documents")}
                  data-testid="button-upload-document"
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload Document
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/messages")}
                  data-testid="button-message-admin"
                >
                  <i className="fas fa-envelope mr-2"></i>
                  Message Admin
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-baco-primary text-baco-primary hover:bg-baco-primary hover:text-white"
                  onClick={() => navigate("/request-invoice")}
                  data-testid="button-request-invoice"
                >
                  <i className="fas fa-file-invoice mr-2"></i>
                  Request Invoice
                </Button>
              </CardContent>
            </Card>

            {/* My Documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Documents</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/documents")}
                    className="text-baco-primary hover:text-baco-secondary"
                    data-testid="button-view-all-documents"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Approved</span>
                    <Badge className="bg-green-100 text-green-800">{documentCounts.approved}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pending</span>
                    <Badge className="bg-yellow-100 text-yellow-800">{documentCounts.pending}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Rejected</span>
                    <Badge className="bg-red-100 text-red-800">{documentCounts.rejected}</Badge>
                  </div>
                  <Separator className="my-3" />
                  {recentDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {recentDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-900 truncate flex-1">{doc.fileName}</span>
                          <Badge 
                            className={`ml-2 ${
                              doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                              doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-2 text-sm">No documents uploaded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Messages</CardTitle>
                  {(unreadCount?.count ?? 0) > 0 && (
                    <Badge variant="destructive" data-testid="badge-unread-count">
                      {unreadCount?.count}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-gray-200">
                {adminMessages.length > 0 ? (
                  adminMessages.map((message: any) => (
                    <MessageCard key={message.id} message={message} />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No messages</p>
                )}
                
                <div className="pt-3">
                  <Button
                    variant="ghost"
                    className="w-full text-baco-primary hover:text-baco-secondary"
                    onClick={() => navigate("/messages")}
                    data-testid="button-view-all-messages"
                  >
                    View All Messages
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Membership Details */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Member ID</dt>
                    <dd className="text-sm text-gray-900" data-testid="text-member-id">
                      BACO-{new Date(user?.createdAt || '').getFullYear()}-{user?.id?.slice(-6).toUpperCase()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Join Date</dt>
                    <dd className="text-sm text-gray-900" data-testid="text-join-date">
                      {user?.joinDate ? format(new Date(user.joinDate), 'MMMM dd, yyyy') : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Membership Type</dt>
                    <dd className="text-sm text-gray-900 capitalize" data-testid="text-membership-type">
                      {user?.membershipType || 'Professional'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Next Payment Due</dt>
                    <dd className="text-sm text-gray-900" data-testid="text-next-payment-due">
                      {(() => {
                        const today = new Date();
                        const thisYearFeb15 = new Date(today.getFullYear(), 1, 15); // Month is 0-indexed
                        const nextPaymentDate = today > thisYearFeb15 
                          ? new Date(today.getFullYear() + 1, 1, 15) 
                          : thisYearFeb15;
                        return format(nextPaymentDate, 'MMMM dd, yyyy');
                      })()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd>
                      <Badge 
                        className={
                          user?.membershipStatus === 'active' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        }
                        data-testid="badge-membership-status"
                      >
                        {user?.membershipStatus || 'Pending'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
