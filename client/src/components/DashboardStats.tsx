import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface DashboardStatsProps {
  user: any;
  unreadCount: number;
}

export default function DashboardStats({ user, unreadCount }: DashboardStatsProps) {
  const [, navigate] = useLocation();
  
  const stats = [
    {
      title: "Membership Status",
      value: user?.membershipStatus === "active" ? "Active" : "Pending",
      icon: "fas fa-check",
      color: user?.membershipStatus === "active" ? "baco-success" : "yellow-500",
      bgColor: user?.membershipStatus === "active" ? "baco-success/20" : "yellow-100",
      onClick: undefined,
    },
    {
      title: "Next Payment Due",
      value: (() => {
        // If membership is pending, show Feb 15th, 2025
        if (user?.membershipStatus === "pending") {
          return new Date(2025, 1, 15).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
        }
        // For active members, calculate next Feb 15th
        const today = new Date();
        const thisYearFeb15 = new Date(today.getFullYear(), 1, 15); // Month is 0-indexed
        const nextPaymentDate = today > thisYearFeb15 
          ? new Date(today.getFullYear() + 1, 1, 15) 
          : thisYearFeb15;
        return nextPaymentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      })(),
      icon: "fas fa-calendar",
      color: "baco-primary",
      bgColor: "baco-primary/20",
      onClick: undefined,
    },
    {
      title: "Documents",
      value: "View Files",
      icon: "fas fa-file-alt",
      color: "baco-accent",
      bgColor: "baco-accent/20",
      onClick: () => navigate("/documents"),
    },
    {
      title: "Unread Messages",
      value: unreadCount.toString(),
      icon: "fas fa-envelope",
      color: "purple-600",
      bgColor: "purple-100",
      onClick: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={`border-gray-200 ${stat.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          onClick={stat.onClick}
        >
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
