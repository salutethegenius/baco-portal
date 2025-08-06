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

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
  });

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ["/api/event-registrations/my"],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/messages/my"],
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
  });

  const upcomingEvents = events
    .filter((event: any) => new Date(event.startDate) > new Date())
    .slice(0, 3);

  const recentMessages = messages.slice(0, 3);

  const recentActivity = [
    {
      type: "payment",
      message: "Membership payment processed successfully",
      date: "2 days ago",
      icon: "check",
      color: "baco-success",
    },
    {
      type: "document",
      message: "Uploaded professional certificate",
      date: "1 week ago",
      icon: "file",
      color: "baco-primary",
    },
    {
      type: "event",
      message: "Registered for Annual Compliance Conference 2024",
      date: "2 weeks ago",
      icon: "calendar",
      color: "baco-accent",
    },
  ];

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
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivity.map((activity, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== recentActivity.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full bg-${activity.color} flex items-center justify-center ring-8 ring-white`}>
                                <i className={`fas fa-${activity.icon} text-white text-xs`}></i>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{activity.message}</p>
                              <p className="mt-0.5 text-xs text-gray-500">{activity.date}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
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
                  className="w-full bg-baco-primary hover:bg-baco-secondary"
                  onClick={() => navigate("/checkout/membership")}
                  data-testid="button-make-payment"
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  Make Payment
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
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Messages</CardTitle>
                  {unreadCount?.count > 0 && (
                    <Badge variant="destructive" data-testid="badge-unread-count">
                      {unreadCount.count}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-gray-200">
                {recentMessages.length > 0 ? (
                  recentMessages.map((message: any) => (
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
                    <dt className="text-sm font-medium text-gray-500">Annual Fee</dt>
                    <dd className="text-sm text-gray-900" data-testid="text-annual-fee">
                      ${user?.annualFee || '350.00'} BSD
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
