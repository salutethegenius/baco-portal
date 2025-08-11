import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await apiRequest("POST", "/api/login", { email, password });
      const userData = await response.json();
      
      toast({
        title: "Welcome back!",
        description: "You've been successfully signed in.",
      });
      
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/register", {
        email,
        password,
        firstName,
        lastName,
      });
      const userData = await response.json();
      
      toast({
        title: "Registration Successful!",
        description: "Welcome to BACO! Your membership is pending approval.",
      });
      
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-baco-neutral to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-baco-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BACO</h1>
              <p className="text-sm text-gray-600">Bahamas Association of Compliance Officers</p>
            </div>
          </div>
        </header>

        <div className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Authentication Forms */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sign In to Your Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            name="email"
                            type="email"
                            required
                            placeholder="your@email.com"
                            data-testid="input-login-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <Input
                            id="login-password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            data-testid="input-login-password"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-baco-primary hover:bg-baco-secondary"
                          disabled={isLoading}
                          data-testid="button-login-submit"
                        >
                          {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                      </form>
                      
                      {/* Additional Options */}
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                          Don't have an account yet?
                        </p>
                        <Link href="/member-registration">
                          <Button variant="link" className="text-baco-primary hover:text-baco-secondary">
                            Apply for BACO Membership
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Your Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="register-firstName">First Name</Label>
                            <Input
                              id="register-firstName"
                              name="firstName"
                              required
                              placeholder="John"
                              data-testid="input-register-firstName"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="register-lastName">Last Name</Label>
                            <Input
                              id="register-lastName"
                              name="lastName"
                              required
                              placeholder="Doe"
                              data-testid="input-register-lastName"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-email">Email</Label>
                          <Input
                            id="register-email"
                            name="email"
                            type="email"
                            required
                            placeholder="your@email.com"
                            data-testid="input-register-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <Input
                            id="register-password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            minLength={6}
                            data-testid="input-register-password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-confirmPassword">Confirm Password</Label>
                          <Input
                            id="register-confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            placeholder="••••••••"
                            minLength={6}
                            data-testid="input-register-confirmPassword"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-baco-primary hover:bg-baco-secondary"
                          disabled={isLoading}
                          data-testid="button-register-submit"
                        >
                          {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  
                  {/* Member Registration Link */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Want to become a BACO member?
                    </p>
                    <Link href="/member-registration">
                      <Button variant="outline" className="w-full" data-testid="button-member-registration">
                        Apply for BACO Membership
                      </Button>
                    </Link>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Quick Access Links */}
              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-gray-500">
                  New to BACO?
                </p>
                <Link href="/member-registration">
                  <Button variant="link" className="text-baco-primary hover:text-baco-secondary">
                    Learn about membership benefits →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Section */}
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Join the Premier
                <br />
                <span className="text-baco-primary">Compliance Community</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Connect with fellow compliance professionals in the Bahamas. Access exclusive events, 
                resources, and continue your professional development with BACO.
              </p>
              
              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-baco-primary bg-opacity-20 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-baco-primary text-sm"></i>
                  </div>
                  <span className="text-gray-700">Professional networking events</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-baco-primary bg-opacity-20 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-baco-primary text-sm"></i>
                  </div>
                  <span className="text-gray-700">Certification and training programs</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-baco-primary bg-opacity-20 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-baco-primary text-sm"></i>
                  </div>
                  <span className="text-gray-700">Industry updates and resources</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-baco-primary bg-opacity-20 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-baco-primary text-sm"></i>
                  </div>
                  <span className="text-gray-700">Member directory and messaging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}