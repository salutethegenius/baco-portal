import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-baco-neutral to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-baco-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BACO</h1>
                <p className="text-sm text-gray-600">Bahamas Association of Compliance Officers</p>
              </div>
            </div>
            <div className="space-x-2">
              <Button 
                onClick={() => window.location.href = "/member-registration"}
                variant="outline"
                className="border-baco-primary text-baco-primary hover:bg-baco-primary hover:text-white"
                data-testid="button-apply"
              >
                Apply
              </Button>
              <Button 
                onClick={() => window.location.href = "/auth"}
                className="bg-baco-primary hover:bg-baco-secondary"
                data-testid="button-login"
              >
                Sign In
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Professional Compliance
                <br />
                <span className="text-baco-primary">Community</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join the premier association for compliance officers in the Bahamas. 
                Access exclusive events, resources, and connect with industry professionals.
              </p>
              <div className="space-x-4">
                <Button 
                  size="lg"
                  onClick={() => window.location.href = "/member-registration"}
                  className="bg-baco-primary hover:bg-baco-secondary px-8 py-3"
                  data-testid="button-get-started"
                >
                  Apply for Membership
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = "/auth"}
                  className="border-baco-primary text-baco-primary hover:bg-baco-primary hover:text-white px-8 py-3"
                  data-testid="button-existing-member"
                >
                  Existing Member Sign In
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-baco-primary/10 to-baco-secondary/20 rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <img 
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1926&q=80" 
                  alt="Professional compliance team meeting in modern office" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="bg-baco-primary/90 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-sm font-medium">Nassau, Bahamas</p>
                  </div>
                </div>
              </div>
              
              {/* Floating cards for visual interest */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-green-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">500+</p>
                    <p className="text-xs text-gray-500">Active Members</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-calendar text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">25+</p>
                    <p className="text-xs text-gray-500">Annual Events</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Membership Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-baco-primary bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-calendar-alt text-baco-primary text-xl"></i>
                </div>
                <CardTitle className="text-xl font-semibold">Professional Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access exclusive conferences, workshops, and networking events designed for compliance professionals.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-baco-accent bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-certificate text-baco-accent text-xl"></i>
                </div>
                <CardTitle className="text-xl font-semibold">Certification Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Enhance your expertise with our comprehensive certification and continuing education programs.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-baco-success bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-users text-baco-success text-xl"></i>
                </div>
                <CardTitle className="text-xl font-semibold">Professional Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Connect with fellow compliance professionals and industry leaders across the Bahamas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-20">
          <Card className="max-w-2xl mx-auto bg-baco-primary text-white">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-4">Ready to Join BACO?</h3>
              <p className="text-lg mb-8 opacity-90">
                Become part of the leading compliance community in the Bahamas and advance your career.
              </p>
              <div className="space-x-4">
                <Button 
                  size="lg"
                  onClick={() => window.location.href = "/member-registration"}
                  className="bg-white text-baco-primary hover:bg-gray-100 px-8 py-3"
                  data-testid="button-join-now"
                >
                  Apply for Membership
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => window.location.href = "/auth"}
                  className="bg-transparent border-white text-white hover:bg-white hover:text-baco-primary px-8 py-3"
                  data-testid="button-member-signin"
                >
                  Member Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
