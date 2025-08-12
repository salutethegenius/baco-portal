
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Star, Award, Network, Trophy } from "lucide-react";
import EventRegistrationForm from "@/components/EventRegistrationForm";

export default function BacoConference2025() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // Mock event data for the conference
  const conferenceEvent = {
    id: "baco-conference-2025",
    title: "BACO Conference 2025 – Celebrating 25 Years of Compliance",
    description: "Rooted in Integrity, Growing with Purpose",
    startDate: "2025-11-13T08:00:00",
    endDate: "2025-11-14T17:00:00",
    location: "Bahamar Convention Center, Nassau, Bahamas",
    price: "350",
    maxAttendees: 500,
    currentAttendees: 0,
    slug: "baco-conference-2025"
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
            filter: 'brightness(0.4)'
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        
        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
          {/* 25th Anniversary Badge */}
          <div className="mb-6">
            <Badge className="bg-gold-500 text-black px-6 py-2 text-lg font-bold">
              <Award className="w-5 h-5 mr-2" />
              25th Anniversary Celebration
            </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            BACO Conference 2025
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-gold-300">
            Celebrating 25 Years of Compliance
          </h2>
          
          <p className="text-xl md:text-2xl mb-8 font-medium italic">
            Rooted in Integrity, Growing with Purpose
          </p>

          {/* Event Quick Info */}
          <div className="flex flex-wrap justify-center gap-6 mb-10 text-lg">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Calendar className="w-5 h-5" />
              <span>November 13–14, 2025</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Clock className="w-5 h-5" />
              <span>8:00 AM – 5:00 PM Daily</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <MapPin className="w-5 h-5" />
              <span>Bahamar Convention Center</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className="bg-gold-500 hover:bg-gold-600 text-black font-bold text-xl px-12 py-4 h-auto"
            onClick={() => setShowRegistrationForm(true)}
          >
            Register Today - Secure Your Spot
          </Button>
        </div>
      </section>

      {/* Event Highlights Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Attend This Historic Event?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              This is more than a conference — it's a celebration of our profession's growth, resilience, and future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-baco-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Insights</h3>
              <p className="text-gray-600">
                Gain insights from top compliance experts on emerging trends and challenges
              </p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-baco-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Interactive Workshops</h3>
              <p className="text-gray-600">
                Participate in hands-on workshops designed to strengthen your skills
              </p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-baco-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Network className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Premium Networking</h3>
              <p className="text-gray-600">
                Connect with peers, regulators, and industry leaders from across the region
              </p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-baco-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">25-Year Celebration</h3>
              <p className="text-gray-600">
                Celebrate 25 years of compliance excellence with the BACO community
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Event Info */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">Event Details</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Calendar className="w-6 h-6 text-baco-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Dates</h3>
                    <p className="text-gray-600">November 13–14, 2025</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-baco-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Schedule</h3>
                    <p className="text-gray-600">8:00 AM – 5:00 PM Daily</p>
                    <p className="text-sm text-baco-primary font-medium">
                      Special Cocktail Reception: November 14, 2:00 PM – 5:00 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-baco-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Venue</h3>
                    <p className="text-gray-600">Bahamar Convention Center</p>
                    <p className="text-gray-600">Nassau, Bahamas</p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <Button
                  size="lg"
                  className="bg-baco-primary hover:bg-baco-secondary text-white font-semibold px-8 py-3"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  Register Now - $350 BSD
                </Button>
              </div>
            </div>

            {/* Registration Info Card */}
            <Card className="p-8">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-baco-primary mb-2">
                  Join 500+ Compliance Professionals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-baco-primary mb-2">$350</div>
                  <p className="text-gray-600">BSD (Bahamian Dollar)</p>
                  <p className="text-sm text-green-600 font-medium mt-1">Early Bird Special Available</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Conference Access (2 Days)</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>All Workshops & Sessions</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Networking Meals</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cocktail Reception</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conference Materials</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>25th Anniversary Memorabilia</span>
                    <span className="text-green-600">✓</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-3"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  Secure Your Spot Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-baco-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">
            Be Part of History
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join us for this landmark celebration of 25 years of compliance excellence. 
            Network with industry leaders, gain valuable insights, and help shape the future of compliance in the Bahamas.
          </p>
          <Button
            size="lg"
            className="bg-white text-baco-primary hover:bg-gray-100 font-bold text-xl px-12 py-4 h-auto"
            onClick={() => setShowRegistrationForm(true)}
          >
            Register Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">Bahamas Association of Compliance Officers</h3>
            <p className="text-gray-400">Celebrating 25 Years of Excellence</p>
          </div>
          <div className="text-gray-400">
            <p>For questions about the conference, contact us at info@baco-bahamas.com</p>
          </div>
        </div>
      </footer>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <EventRegistrationForm
          event={conferenceEvent}
          onClose={() => setShowRegistrationForm(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
}
