import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Award, Network, Trophy } from "lucide-react";
import EventRegistrationForm from "@/components/EventRegistrationForm";
import confetti from 'canvas-confetti';

// Confetti component
const Confetti = ({ isActive }: { isActive: boolean }) => {
  useEffect(() => {
    if (!isActive) return;

    try {
      // Use canvas-confetti library
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      // Fallback to DOM-based confetti if library fails
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
      const confettiElements: HTMLElement[] = [];

      for (let i = 0; i < 30; i++) {
        const confettiDiv = document.createElement('div');
        confettiDiv.style.position = 'fixed';
        confettiDiv.style.left = Math.random() * 100 + 'vw';
        confettiDiv.style.top = '-10px';
        confettiDiv.style.width = '8px';
        confettiDiv.style.height = '8px';
        confettiDiv.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confettiDiv.style.pointerEvents = 'none';
        confettiDiv.style.zIndex = '9999';
        confettiDiv.style.borderRadius = '50%';
        confettiDiv.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;

        document.body.appendChild(confettiDiv);
        confettiElements.push(confettiDiv);
      }

    // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);

      // Cleanup
      const timeout = setTimeout(() => {
        confettiElements.forEach(el => el.remove());
        style.remove();
      }, 4000);

      return () => {
        clearTimeout(timeout);
        confettiElements.forEach(el => el.remove());
        style.remove();
      };
    }
  }, [isActive]);

  return null;
};


export default function BacoConference2025() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleRegisterClick = () => {
    setShowRegistrationForm(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
  };

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
    currentAttendees: 184, // Updated to reflect current attendees
    slug: "baco-conference-2025"
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false);
  };

  const isRegistrationClosed = conferenceEvent.currentAttendees >= conferenceEvent.maxAttendees;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/Grand-Hyatt-Baha-Mar-P212-Convention-Center-Hotel-Main-Entrance.16x9.webp')`,
            filter: 'brightness(0.5)'
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />

        {/* Hero Content */}
        <div className={`relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto transition-all duration-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {/* 25th Anniversary Badge */}
          <div className="mb-6 transition-all duration-1000 delay-500">
            <Badge className="bg-gold-500 text-black px-6 py-2 text-lg font-bold">
              <Award className="w-5 h-5 mr-2" />
              25th Anniversary Celebration
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight transition-all duration-1000 delay-700">
            BACO Conference 2025
          </h1>

          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-6 md:mb-8 text-gold-300 transition-all duration-1000 delay-900">
            Celebrating 25 Years of Compliance
          </h2>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 font-medium italic transition-all duration-1000 delay-1000">
            Rooted in Integrity, Growing with Purpose
          </p>

          {/* Event Quick Info */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 sm:gap-6 mb-8 md:mb-10 text-sm sm:text-base lg:text-lg transition-all duration-1000 delay-1100">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 transform hover:scale-105 transition-transform duration-200">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">November 13–14, 2025</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 transform hover:scale-105 transition-transform duration-200">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">8:00 AM – 5:00 PM Daily</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 transform hover:scale-105 transition-transform duration-200">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Bahamar Convention Center</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className={`mb-8 md:mb-12 transition-all duration-1000 delay-1100 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            {isRegistrationClosed ? (
              <Button
                size="lg"
                className="bg-gray-400 text-white cursor-not-allowed text-lg px-8 py-6"
                disabled={true}
              >
                Registration Closed ({conferenceEvent.currentAttendees}/{conferenceEvent.maxAttendees} Registered)
              </Button>
            ) : (
              <Button
                onClick={handleRegisterClick}
                size="lg"
                className="bg-gold-500 hover:bg-gold-600 text-black font-bold px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 animate-bounce hover:animate-none touch-manipulation"
              >
                Register Now
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Event Highlights Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 transition-all duration-1000 delay-1200">
              Why Attend This Historic Event?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto transition-all duration-1000 delay-1300">
              This is more than a conference — it's a celebration of our profession's growth, resilience, and future.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: Award, title: "25-Year Celebration", description: "Celebrate 25 years of compliance excellence with the BACO community", delay: 1400 },
              { icon: Users, title: "Premium Networking", description: "Connect with peers, regulators, and industry leaders from across the region", delay: 1500 },
              { icon: Network, title: "Expert Insights", description: "Gain insights from top compliance experts on emerging trends and challenges", delay: 1600 },
              { icon: Trophy, title: "Interactive Workshops", description: "Participate in hands-on workshops designed to strengthen your skills", delay: 1700 }
            ].map((item, index) => (
              <Card
                key={index}
                className={`text-center p-4 sm:p-6 hover:shadow-lg transition-all duration-1000 hover:transform hover:scale-105 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${item.delay}ms` }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-baco-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-transform duration-300 hover:rotate-12">
                  <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Event Info */}
            <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1800ms' }}>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 lg:mb-8">Event Details</h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-baco-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Dates</h3>
                    <p className="text-gray-600 text-sm sm:text-base">November 13–14, 2025</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-baco-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Schedule</h3>
                    <p className="text-gray-600 text-sm sm:text-base">8:00 AM – 5:00 PM Daily</p>
                    <p className="text-xs sm:text-sm text-baco-primary font-medium">
                      Special Cocktail Reception: November 14, 2:00 PM – 5:00 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-baco-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Venue</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Bahamar Convention Center</p>
                    <p className="text-gray-600 text-sm sm:text-base">Nassau, Bahamas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Info Card */}
            <Card className={`p-4 sm:p-6 lg:p-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1900ms' }}>
              <CardHeader className="text-center pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-baco-primary mb-2">
                  Join {conferenceEvent.maxAttendees} Compliance Professionals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-baco-primary mb-2">Starting at $350</div>
                  <p className="text-gray-600 text-sm sm:text-base">BSD (Bahamian Dollar)</p>
                  <p className="text-xs sm:text-sm text-green-600 font-medium mt-1">Multiple Options Available</p>
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

                </CardContent>
            </Card>
          </div>
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

      {/* Confetti Component */}
      <Confetti isActive={showConfetti} />

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