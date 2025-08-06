import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatsProps {
  user: any;
  unreadCount: number;
}

export default function DashboardStats({ user, unreadCount }: DashboardStatsProps) {
  const stats = [
    {
      title: "Membership Status",
      value: user?.membershipStatus === "active" ? "Active" : "Pending",
      icon: "fas fa-check",
      color: user?.membershipStatus === "active" ? "baco-success" : "yellow-500",
      bgColor: user?.membershipStatus === "active" ? "baco-success/20" : "yellow-100",
    },
    {
      title: "Next Payment Due",
      value: user?.nextPaymentDate ? new Date(user.nextPaymentDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) : "N/A",
      icon: "fas fa-calendar",
      color: "baco-primary",
      bgColor: "baco-primary/20",
    },
    {
      title: "Documents",
      value: "View Files",
      icon: "fas fa-file-alt",
      color: "baco-accent",
      bgColor: "baco-accent/20",
    },
    {
      title: "Unread Messages",
      value: unreadCount.toString(),
      icon: "fas fa-envelope",
      color: "purple-600",
      bgColor: "purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 bg-${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <i className={`${stat.icon} text-${stat.color} text-sm`}></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-lg font-semibold text-gray-900" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
