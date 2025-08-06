import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Header() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
  });

  const navItems = [
    { path: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
    { path: "/events", label: "Events", icon: "fas fa-calendar-alt" },
    { path: "/documents", label: "Documents", icon: "fas fa-file-alt" },
    { path: "/messages", label: "Messages", icon: "fas fa-envelope" },
    { path: "/profile", label: "Profile", icon: "fas fa-user" },
  ];

  if (user?.isAdmin) {
    navItems.push({ path: "/admin", label: "Admin", icon: "fas fa-cog" });
  }

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-baco-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900">BACO</h1>
              <p className="text-xs text-gray-500">Bahamas Association of Compliance Officers</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative px-1 pb-4 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-baco-primary border-b-2 border-baco-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.label}
                {item.path === "/messages" && unreadCount?.count > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500"
                    data-testid="badge-nav-messages-unread"
                  >
                    {unreadCount.count}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <i className="fas fa-bell"></i>
              {unreadCount?.count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount.count}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <img 
                className="h-8 w-8 rounded-full object-cover" 
                src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=1565C0&color=fff`}
                alt="User avatar"
                data-testid="img-user-avatar"
              />
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900" data-testid="text-user-name">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize" data-testid="text-membership-status">
                  {user?.membershipStatus} Member
                </p>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(item.path)
                  ? "text-baco-primary bg-baco-primary/10"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <i className={`${item.icon} mr-2`}></i>
              {item.label}
              {item.path === "/messages" && unreadCount?.count > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500">
                  {unreadCount.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
