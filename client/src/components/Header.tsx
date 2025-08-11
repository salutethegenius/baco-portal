import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", current: location === "/" },
    { name: "Events", href: "/events", current: location === "/events" },
    { name: "Documents", href: "/documents", current: location === "/documents" },
    { name: "Messages", href: "/messages", current: location === "/messages" },
    { name: "Profile", href: "/profile", current: location === "/profile" },
  ];

  if (!isAuthenticated) return null;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-xl font-bold text-baco-primary cursor-pointer">
                BACO Portal
              </h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span
                  className={`${
                    item.current
                      ? "text-baco-primary font-medium"
                      : "text-gray-700 hover:text-baco-primary"
                  } px-3 py-2 text-sm cursor-pointer transition-colors`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
            {user?.isAdmin && (
              <Link href="/admin">
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-baco-primary hover:text-white transition-colors"
                >
                  Admin
                </Badge>
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, {user?.firstName || user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}