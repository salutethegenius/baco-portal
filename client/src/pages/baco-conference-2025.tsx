import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Network,
  Trophy,
} from "lucide-react";
import EventRegistrationForm from "@/components/EventRegistrationForm";
import confetti from "canvas-confetti";

// Confetti component
const Confetti = ({ isActive }: { isActive: boolean }) => {
  useEffect(() => {
    if (!isActive) return;

    try {
      // Use canvas-confetti library
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (error) {
      // Fallback to DOM-based confetti if library fails
      const colors = [
        "#FFD700",
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FECA57",
      ];
      const confettiElements: HTMLElement[] = [];

      for (let i = 0; i < 30; i++) {
        const confettiDiv = document.createElement("div");
        confettiDiv.style.position = "fixed";
        confettiDiv.style.left = Math.random() * 100 + "vw";
        confettiDiv.style.top = "-10px";
        confettiDiv.style.width = "8px";
        confettiDiv.style.height = "8px";
        confettiDiv.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        confettiDiv.style.pointerEvents = "none";
        confettiDiv.style.zIndex = "9999";
        confettiDiv.style.borderRadius = "50%";
        confettiDiv.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;

        document.body.appendChild(confettiDiv);
        confettiElements.push(confettiDiv);
      }

      // Add CSS animation
      const style = document.createElement("style");
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
        confettiElements.forEach((el) => el.remove());
        style.remove();
      }, 4000);

      return () => {
        clearTimeout(timeout);
        confettiElements.forEach((el) => el.remove());
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
    slug: "baco-conference-2025",
    registrationClosed: true, // Registration is now closed
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false);
  };

  const isRegistrationClosed = true; // Registration is now closed for this event

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/Grand-Hyatt-Baha-Mar-P212-Convention-Center-Hotel-Main-Entrance.16x9.webp')`,
            filter: "brightness(0.5)",
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />

        {/* Hero Content */}
        <div
          className={`relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
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
              <span className="whitespace-nowrap">
                Bahamar Convention Center
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <div
            className={`mb-8 md:mb-12 transition-all duration-1000 delay-1100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {isRegistrationClosed ? (
              <Button
                size="lg"
                className="bg-gray-400 text-white cursor-not-allowed text-lg px-8 py-6"
                disabled={true}
              >
                Registration Closed
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
              This is more than a conference — it's a celebration of our
              profession's growth, resilience, and future.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                icon: Award,
                title: "25-Year Celebration",
                description:
                  "Celebrate 25 years of compliance excellence with the BACO community",
                delay: 1400,
              },
              {
                icon: Users,
                title: "Premium Networking",
                description:
                  "Connect with peers, regulators, and industry leaders from across the region",
                delay: 1500,
              },
              {
                icon: Network,
                title: "Expert Insights",
                description:
                  "Gain insights from top compliance experts on emerging trends and challenges",
                delay: 1600,
              },
              {
                icon: Trophy,
                title: "Interactive Workshops",
                description:
                  "Participate in hands-on workshops designed to strengthen your skills",
                delay: 1700,
              },
            ].map((item, index) => (
              <Card
                key={index}
                className={`text-center p-4 sm:p-6 hover:shadow-lg transition-all duration-1000 hover:transform hover:scale-105 ${
                  isLoaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${item.delay}ms` }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-baco-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-transform duration-300 hover:rotate-12">
                  <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {item.description}
                </p>
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
            <div
              className={`transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: "1800ms" }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 lg:mb-8">
                Event Details
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-baco-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">
                      Dates
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      November 13–14, 2025
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-baco-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">
                      Schedule
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      8:00 AM – 5:00 PM Daily
                    </p>
                    <p className="text-xs sm:text-sm text-baco-primary font-medium">
                      Special Cocktail Reception: November 14, 2:00 PM – 5:00 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-baco-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">
                      Venue
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Bahamar Convention Center
                    </p>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Nassau, Bahamas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Info Card */}
            <Card
              className={`p-4 sm:p-6 lg:p-8 transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: "1900ms" }}
            >
              <CardHeader className="text-center pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-baco-primary mb-2">
                  Join {conferenceEvent.maxAttendees} Compliance Professionals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-baco-primary mb-2">
                    Starting at $350
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">
                    BSD (Bahamian Dollar)
                  </p>
                  <p className="text-xs sm:text-sm text-green-600 font-medium mt-1">
                    Multiple Options Available
                  </p>
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

      {/* Program Schedule Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Conference Program
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Beyond the Rulebook: Cultivating a Culture of Ethical Resilience
              in Regulatory Compliance
            </p>
          </div>

          <Tabs defaultValue="day1" className="w-full">
            <TabsList
              className="grid w-full max-w-md mx-auto grid-cols-2 mb-8"
              data-testid="tabs-program-days"
            >
              <TabsTrigger value="day1" data-testid="tab-day1">
                Day 1 - Nov 13
              </TabsTrigger>
              <TabsTrigger value="day2" data-testid="tab-day2">
                Day 2 - Nov 14
              </TabsTrigger>
            </TabsList>

            {/* Day 1 Schedule */}
            <TabsContent
              value="day1"
              className="space-y-6"
              data-testid="content-day1"
            >
              {/* Registration & Breakfast */}
              <Card
                className="overflow-hidden"
                data-testid="session-day1-registration"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-registration"
                      >
                        8:00 - 8:30 AM
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-registration"
                      >
                        Registration, Breakfast & Meet the Partners
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Opening Remarks */}
              <Card
                className="overflow-hidden"
                data-testid="session-day1-opening"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-opening"
                      >
                        8:40 - 9:00 AM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3">Opening Remarks</Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-opening"
                      >
                        Invocation & Welcome
                      </h3>
                      <p
                        className="text-gray-700 mb-2"
                        data-testid="speaker-day1-opening"
                      >
                        <strong>Speaker:</strong> Endric Deleveaux, BACO
                        President
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Keynote Opening */}
              <Card
                className="overflow-hidden border-l-4 border-l-baco-primary"
                data-testid="session-day1-keynote"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-keynote"
                      >
                        9:00 - 9:40 AM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3 bg-gold-500 hover:bg-gold-600">
                        Keynote Speaker
                      </Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-keynote"
                      >
                        Nurturing Integrity as a Catalyst for Sustainable Growth
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-keynote"
                      >
                        <strong>Speaker:</strong> The Hon. Deputy Prime Minister
                        Chester I. Cooper
                      </p>
                      <p
                        className="text-gray-600 text-sm"
                        data-testid="description-day1-keynote"
                      >
                        Integrity is more than a compliance requirement—it's the
                        foundation of lasting success. This session explores how
                        organizations can embed integrity into their culture,
                        decision-making, and leadership to drive sustainable
                        growth.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Regulatory Round Table */}
              <Card
                className="overflow-hidden"
                data-testid="session-day1-regulatory-roundtable"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-regulatory-roundtable"
                      >
                        9:45 - 10:45 AM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3">Regulatory Round Table</Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-regulatory-roundtable"
                      >
                        From Regulation to Reputation: Leveraging Integrity for
                        a Stronger Mutual Evaluation Outcome
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-regulatory-roundtable"
                      >
                        <strong>Panel:</strong> Group of Financial Services
                        Regulators
                      </p>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-regulatory-roundtable"
                      >
                        <strong>Moderator:</strong> Past President Maria Dorsett
                      </p>
                      <p
                        className="text-gray-600 text-sm"
                        data-testid="description-day1-regulatory-roundtable"
                      >
                        This panel explores how a culture of integrity enhances
                        institutional reputation during mutual evaluations,
                        discussing transparency, ethical leadership, and
                        alignment of regulatory frameworks with reputational
                        goals.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coffee Break */}
              <Card
                className="overflow-hidden bg-gray-100"
                data-testid="session-day1-coffee-break-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-5 h-5 text-baco-primary" />
                    <span
                      className="font-semibold"
                      data-testid="time-day1-coffee-break-1"
                    >
                      10:45 - 11:00 AM - Coffee Break
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Multi-Jurisdictional Compliance */}
              <Card
                className="overflow-hidden"
                data-testid="session-day1-multi-jurisdictional-compliance"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-multi-jurisdictional-compliance"
                      >
                        11:05 AM - 11:55 AM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3">Session</Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-multi-jurisdictional-compliance"
                      >
                        Managing Multi-Jurisdictional Compliance Risk
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-multi-jurisdictional-compliance"
                      >
                        <strong>Speakers:</strong> Maria Lingham (Director in
                        Advisory Practice, KPMG Bermuda) & Arslan Athar (Risk
                        Consulting Manager, KPMG Bahamas)
                      </p>
                      <p
                        className="text-gray-600 text-sm"
                        data-testid="description-day1-multi-jurisdictional-compliance"
                      >
                        The discussion will focus on practical approaches to
                        harmonizing global standards, mitigating legal exposure,
                        and maintaining operational integrity. Participants will
                        explore tools and techniques to enhance oversight and
                        ensure consistent compliance in complex international
                        environments.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lunch */}
              <Card
                className="overflow-hidden bg-gray-100"
                data-testid="session-day1-lunch"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-5 h-5 text-baco-primary" />
                    <span
                      className="font-semibold"
                      data-testid="time-day1-lunch"
                    >
                      12:00 - 12:55 PM - Lunch
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* DFNBP Panel */}
              <Card
                className="overflow-hidden"
                data-testid="session-day1-dfnbp-sector-spotlight"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-dfnbp-sector-spotlight"
                      >
                        1:10 - 1:50 PM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3">Panel Discussion</Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-dfnbp-sector-spotlight"
                      >
                        DFNBP Sector Spotlight
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-dfnbp-sector-spotlight"
                      >
                        <strong>Panelists:</strong> Kamala Richardson (Attorney,
                        Glinton Sweeting O'Brian Law Firm) & Calvin Rolle (Chief
                        Compliance Officer & MLRO, Lighthouse Asset Management)
                      </p>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-dfnbp-sector-spotlight"
                      >
                        <strong>Moderator:</strong> BACO Asst. Secretary Rayneth
                        Darling
                      </p>
                      <p
                        className="text-gray-600 text-sm"
                        data-testid="description-day1-dfnbp-sector-spotlight"
                      >
                        This panel brings together experts from the legal, real
                        estate, and accounting sectors to discuss the unique
                        compliance challenges and opportunities facing DNFBP.
                        With growing regulatory expectations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Branding */}
              <Card
                className="overflow-hidden"
                data-testid="session-day1-personal-branding"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-personal-branding"
                      >
                        2:05 - 2:35 PM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3">Session</Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-personal-branding"
                      >
                        Beyond the Policy: Using Personal Branding to Build
                        Influence & Trust
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-personal-branding"
                      >
                        <strong>Speaker:</strong> Ethan Quant, CEO Lifestyle
                        Media Group
                      </p>
                      <p
                        className="text-gray-600 text-sm"
                        data-testid="description-day1-personal-branding"
                      >
                        In this session, compliance officers will learn how to
                        go beyond regulatory frameworks and use personal
                        branding as a strategic tool to build trust, enhance
                        visibility, and influence decision-making. The
                        discussion will focus on how authenticity, clarity, and
                        consistent communication can strengthen stakeholder
                        relationships and elevate the role of compliance within
                        the organization.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Troubled Compliance Program */}
              <Card
                className="overflow-hidden"
                data-testid="session-day1-troubled-compliance-program"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-troubled-compliance-program"
                      >
                        2:35 - 3:05 PM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3">Panel Discussion</Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-troubled-compliance-program"
                      >
                        Turning Around a Troubled Compliance Program
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-troubled-compliance-program"
                      >
                        <strong>Panelists:</strong> Ianthe Tynes (Chief
                        Compliance Officer, OKX Bahamas), Jessica Murray (Chief
                        Compliance Officer, Galaxy Bahamas Ltd.), Derek Smith
                        (Asst V.P. Compliance & MLRO, CG Atlantic Group)
                      </p>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-troubled-compliance-program"
                      >
                        <strong>Moderator:</strong> BACO Secretary McQuessa
                        Dawkins
                      </p>
                      <p
                        className="text-gray-600 text-sm"
                        data-testid="description-day1-troubled-compliance-program"
                      >
                        This session offers practical strategies for identifying
                        the root causes of underperforming compliance programs
                        and implementing effective turnaround plans. Attendees
                        will learn how to assess program gaps, rebuild
                        stakeholder trust, and drive cultural change. Real-world
                        examples will highlight how leadership, communication,
                        and strategic alignment can transform compliance from a
                        challenge into a strength.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coffee Break */}
              <Card
                className="overflow-hidden bg-gray-100"
                data-testid="session-day1-coffee-break-2"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-5 h-5 text-baco-primary" />
                    <span
                      className="font-semibold"
                      data-testid="time-day1-coffee-break-2"
                    >
                      3:05 - 3:15 PM - Coffee Break
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Digital Finance Opportunities */}
              <Card
                className="overflow-hidden"
                data-testid="session-day1-digital-finance-opportunities"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-digital-finance-opportunities"
                      >
                        3:20 - 4:00 PM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3">Speaker</Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-digital-finance-opportunities"
                      >
                        The New Compliance Frontier: Positioning Bahamian
                        Professionals for Trade, Digital Finance and
                        Cross-Border Opportunities
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-digital-finance-opportunities"
                      >
                        <strong>Speaker:</strong> Senator Barry Griffin
                        (Chairman of The Bahamas Trade Commission)
                      </p>
                      <p
                        className="text-gray-600 text-sm"
                        data-testid="description-day1-digital-finance-opportunities"
                      >
                        We will explore how Bahamian compliance professionals
                        can strategically position themselves to capitalize on
                        emerging opportunities in trade, digital finance, and
                        cross-border services. It will highlight the evolving
                        global landscape and the skills needed to navigate
                        global standards while fostering regional
                        competitiveness.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Presidents Round Table */}
              <Card
                className="overflow-hidden border-l-4 border-l-gold-500"
                data-testid="session-day1-presidents-round-table"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day1-presidents-round-table"
                      >
                        4:10 - 4:50 PM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3 bg-gold-500 hover:bg-gold-600">
                        Presidents Round Table
                      </Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day1-presidents-round-table"
                      >
                        The Evolution of Compliance: 25 Years of Leadership,
                        Lessons, and Legacy
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-presidents-round-table"
                      >
                        <strong>President's Panel:</strong> Founding President
                        Cheryl Bazard, Past President Kesna Pinder, Past
                        President Natasha Bastian
                      </p>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day1-presidents-round-table"
                      >
                        <strong>Moderator:</strong> President Endric Deleveaux
                      </p>
                      <p
                        className="text-gray-600 text-sm"
                        data-testid="description-day1-presidents-round-table"
                      >
                        A reflective panel featuring former BACO presidents who
                        shaped the compliance landscape over the past 25 years.
                        This session highlights key milestones, lessons learned,
                        and the enduring impact of integrity-driven leadership
                        on the future of compliance.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wrap-Up */}
              <Card
                className="overflow-hidden"
                data-testid="session-day1-wrap-up"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-5 h-5 text-baco-primary" />
                    <span
                      className="font-semibold"
                      data-testid="time-day1-wrap-up"
                    >
                      4:50 - 4:55 PM - Wrap-Up
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Day 2 Schedule */}
            <TabsContent
              value="day2"
              className="space-y-6"
              data-testid="content-day2"
            >
              {/* Registration & Coffee */}
              <Card
                className="overflow-hidden"
                data-testid="session-day2-registration"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day2-registration"
                      >
                        8:00 - 8:30 AM
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day2-registration"
                      >
                        Registration, Morning Coffee & Meet the Partners
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Welcome */}
              <Card
                className="overflow-hidden"
                data-testid="session-day2-welcome"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-5 h-5 text-baco-primary" />
                    <span
                      className="font-semibold"
                      data-testid="time-day2-welcome"
                    >
                      8:50 - 9:00 AM - Welcome
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Morning Keynote */}
              <Card
                className="overflow-hidden border-l-4 border-l-baco-primary"
                data-testid="session-day2-keynote"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day2-keynote"
                      >
                        9:00 - 9:40 AM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3 bg-gold-500 hover:bg-gold-600">
                        Presenter
                      </Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day2-keynote"
                      >
                        Integrity in Action: Leading with Purpose in Times of
                        Change
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day2-keynote"
                      >
                        <strong>Speaker:</strong> Dr. Leo Rolle, CEO Chamber of
                        Commerce
                      </p>
                      <p
                        className="text-gray-600 text-sm mb-2"
                        data-testid="description-day2-keynote"
                      >
                        True leadership is defined by the courage to lead with
                        integrity, especially when the path is unclear. This
                        keynote explores:
                      </p>
                      <ul className="text-gray-600 text-sm list-disc list-inside space-y-1">
                        <li>
                          Compliance as a foundation for trust, not a barrier to
                          progress
                        </li>
                        <li>
                          Embracing ethical challenges as opportunities to lead
                          with clarity
                        </li>
                        <li>
                          Building a legacy where doing what's right is
                          inseparable from success
                        </li>
                        <li>
                          Reimagining business as rooted in responsibility and
                          shared purpose
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CRS/FATCA Round Table */}
              <Card
                className="overflow-hidden"
                data-testid="session-day2-crs-fatca-roundtable"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day2-crs-fatca-roundtable"
                      >
                        9:45 - 10:40 AM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3">Round Table</Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day2-crs-fatca-roundtable"
                      >
                        From Missteps to Mastery: Strengthening CRS/FATCA
                        Compliance Through Error Analysis
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day2-crs-fatca-roundtable"
                      >
                        <strong>Speaker:</strong> Samantha Pratt, CEO/Founder
                        Blue Turtle Consultants, Corporate & Financial Service
                        Consultant
                      </p>
                      <p
                        className="text-gray-600 text-sm"
                        data-testid="description-day2-crs-fatca-roundtable"
                      >
                        Discover how compliance missteps can become powerful
                        learning tools. This session delves into common
                        reporting errors in CRS and FATCA, offering practical
                        approaches to error analysis and remediation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coffee Break */}
              <Card
                className="overflow-hidden bg-gray-100"
                data-testid="session-day2-coffee-break"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-5 h-5 text-baco-primary" />
                    <span
                      className="font-semibold"
                      data-testid="time-day2-coffee-break"
                    >
                      10:40 - 11:00 AM - Coffee Break
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 20 Compliance Mistakes */}
              <Card
                className="overflow-hidden"
                data-testid="session-day2-compliance-mistakes"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day2-compliance-mistakes"
                      >
                        11:05 AM - 11:50 AM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3">Presenter</Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day2-compliance-mistakes"
                      >
                        Avoiding the Traps: 20 Compliance Mistakes You Can Fix
                        Today
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day2-compliance-mistakes"
                      >
                        <strong>Speaker:</strong> Nekeisha Smith, Co-Founder
                        Internal Audit Solutions
                      </p>
                      <p
                        className="text-gray-600 text-sm mb-2"
                        data-testid="description-day2-compliance-mistakes"
                      >
                        This session unpacks 20 critical issues that
                        organizations must avoid to build resilient, ethical,
                        and effective compliance frameworks, exploring:
                      </p>
                      <ul className="text-gray-600 text-sm list-disc list-inside space-y-1">
                        <li>
                          Hidden vulnerabilities that weaken compliance culture
                        </li>
                        <li>Misalignments between policy and practice</li>
                        <li>
                          The cost of neglecting accountability and transparency
                        </li>
                        <li>
                          Practical strategies to transform challenges into
                          opportunities
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lunch */}
              <Card
                className="overflow-hidden bg-gray-100"
                data-testid="session-day2-lunch"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-5 h-5 text-baco-primary" />
                    <span
                      className="font-semibold"
                      data-testid="time-day2-lunch"
                    >
                      12:00 - 12:55 PM - Lunch
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Closing Keynote */}
              <Card
                className="overflow-hidden border-l-4 border-l-baco-primary"
                data-testid="session-day2-closing-keynote"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day2-closing-keynote"
                      >
                        1:10 - 2:00 PM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3 bg-gold-500 hover:bg-gold-600">
                        Keynote Closing Speaker
                      </Badge>
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day2-closing-keynote"
                      >
                        From Roots to Reach, Building Legacy
                      </h3>
                      <p
                        className="text-gray-700 mb-3"
                        data-testid="speaker-day2-closing-keynote"
                      >
                        <strong>Speaker:</strong> Valdez Russell, Principal VKR
                        Insights
                      </p>
                      <p
                        className="text-gray-600 text-sm mb-2"
                        data-testid="description-day2-closing-keynote"
                      >
                        Explore how strong compliance foundations have enabled
                        meaningful growth and lasting impact. Attendees will
                        gain:
                      </p>
                      <ul className="text-gray-600 text-sm list-disc list-inside space-y-1">
                        <li>
                          Understanding of how core compliance values shaped
                          organizational culture
                        </li>
                        <li>
                          Insights into the expanding role of compliance in
                          driving business integrity
                        </li>
                        <li>
                          Reflections on the legacy being built through
                          leadership and innovation
                        </li>
                        <li>
                          A clear roadmap to strengthen programs and foster a
                          culture where integrity thrives
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Closing Remarks */}
              <Card
                className="overflow-hidden"
                data-testid="session-day2-closing-remarks"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-baco-primary flex-shrink-0" />
                      <span
                        className="font-semibold text-baco-primary"
                        data-testid="time-day2-closing-remarks"
                      >
                        2:00 - 2:10 PM
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-bold text-lg mb-2"
                        data-testid="title-day2-closing-remarks"
                      >
                        Closing Remarks
                      </h3>
                      <p
                        className="text-gray-700"
                        data-testid="speaker-day2-closing-remarks"
                      >
                        <strong>Speaker:</strong> Roy-Ann Ford, BACO Vice
                        President
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cocktail Reception */}
              <Card
                className="overflow-hidden border-l-4 border-l-gold-500 bg-gradient-to-r from-gold-50 to-white"
                data-testid="session-day2-cocktail-reception"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Clock className="w-5 h-5 text-gold-600 flex-shrink-0" />
                      <span
                        className="font-semibold text-gold-600"
                        data-testid="time-day2-cocktail-reception"
                      >
                        2:10 - 5:00 PM
                      </span>
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-3 bg-gold-500 hover:bg-gold-600">
                        Special Event
                      </Badge>
                      <h3
                        className="font-bold text-xl mb-2 text-gold-700"
                        data-testid="title-day2-cocktail-reception"
                      >
                        Cocktail Reception
                      </h3>
                      <p
                        className="text-gray-700"
                        data-testid="description-day2-cocktail-reception"
                      >
                        Join us for a celebratory cocktail reception to network
                        with peers and reflect on 25 years of compliance
                        excellence.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">
              Bahamas Association of Compliance Officers
            </h3>
            <p className="text-gray-400">Celebrating 25 Years of Excellence</p>
          </div>
          <div className="text-gray-400">
            <p>
              For questions about the conference, contact us at
              info@baco-bahamas.com
            </p>
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
