import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertEventSchema, insertDocumentSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";

// API validation schema for events that handles string inputs from frontend
const apiEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  location: z.string().optional(),
  price: z.union([z.string(), z.number()]).transform(val =>
    typeof val === 'string' ? val : val.toString()
  ),
  memberPrice: z.union([z.string(), z.number()]).optional().transform(val =>
    val ? (typeof val === 'string' ? val : val.toString()) : undefined
  ),
  nonMemberPrice: z.union([z.string(), z.number()]).optional().transform(val =>
    val ? (typeof val === 'string' ? val : val.toString()) : undefined
  ),
  maxAttendees: z.union([z.string(), z.number()]).transform(val =>
    typeof val === 'string' ? parseInt(val) : val
  ),
  status: z.string().optional().default("upcoming"),

});



export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes are now handled in auth.ts

  // User routes
  app.get('/api/users/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.put('/api/users/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const user = await storage.upsertUser({
        id: userId,
        ...updates,
      });

      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Public event route by slug (no auth required)
  app.get('/api/public/events/:slug', async (req, res) => {
    try {
      const event = await storage.getEventBySlug(req.params.slug);
      if (!event || !event.isPublic) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching public event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Public events list (no auth required)
  app.get('/api/public/events', async (req, res) => {
    try {
      const events = await storage.getEvents();
      const publicEvents = events.filter(event => event.isPublic);
      res.json(publicEvents);
    } catch (error) {
      console.error("Error fetching public events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      console.log("🚀 Event creation request received");
      console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
      console.log("👤 User ID:", req.user.id);

      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        console.error("❌ Non-admin user attempted to create event:", { userId, userIsAdmin: user?.isAdmin });
        return res.status(403).json({ message: "Admin access required" });
      }

      console.log("✅ Admin user verified:", { userId, email: user.email });

      console.log("🔄 Parsing event data...");
      const eventData = apiEventSchema.parse(req.body);
      console.log("✅ Event data parsed successfully:", eventData);

      const slug = eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      console.log("🔗 Generated slug:", slug);

      const eventToCreate = {
        ...eventData,
        createdBy: userId,
        slug,
      };

      console.log("📝 Final event data to create:", eventToCreate);
      console.log("🔄 Creating event in database...");

      const event = await storage.createEvent(eventToCreate);
      console.log("✅ Event created successfully:", event);

      res.json(event);
    } catch (error: any) {
      console.error("❌ Error creating event:", {
        error: error.message,
        stack: error.stack
      });

      if (error.name === 'ZodError') {
        console.error("❌ Validation errors:", error.errors);
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
          receivedData: req.body
        });
      }

      res.status(500).json({
        message: "Failed to create event",
        error: error?.message || 'Unknown error',
        details: error?.stack
      });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const eventData = apiEventSchema.parse(req.body);
      const event = await storage.updateEvent(req.params.id, eventData);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });



  app.delete("/api/events/:id", async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.json({ message: "Event deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting event:", error);

      if (error.message && error.message.includes('existing registrations')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to delete event" });
      }
    }
  });

  // Event registration routes
  app.get('/api/event-registrations/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const registrations = await storage.getUserEventRegistrations(userId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching event registrations:", error);
      res.status(500).json({ message: "Failed to fetch event registrations" });
    }
  });

  // Public event registration endpoint (works for both authenticated and non-authenticated users)
  app.post("/api/event-registrations", async (req, res) => {
    try {
      console.log('Event registration request received:', req.body);
      const { eventId, fullName, email, companyName, position, notes, phone, registrationType, paymentMethod, paymentAmount } = req.body;

      // Validate required fields
      if (!eventId || !fullName || !email) {
        console.log('Missing required fields:', { eventId, fullName, email });
        return res.status(400).json({ message: "Missing required fields: eventId, fullName, email" });
      }

      // Split fullName into firstName and lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('Invalid email format:', email);
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if user is authenticated (optional for public events)
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.id) {
        userId = req.user.id;
      }

      // Validate event exists and is public
      console.log('Fetching event:', eventId);
      const event = await storage.getEvent(eventId);
      if (!event) {
        console.log('Event not found:', eventId);
        return res.status(404).json({ message: "Event not found" });
      }

      if (!event.isPublic) {
        console.log('Event is not public:', eventId);
        return res.status(403).json({ message: "Event is not public" });
      }

      console.log('Event found:', { id: event.id, title: event.title, currentAttendees: event.currentAttendees, maxAttendees: event.maxAttendees });

      // Check if event is full
      if (event.maxAttendees && (event.currentAttendees || 0) >= event.maxAttendees) {
        console.log('Event is full:', { currentAttendees: event.currentAttendees, maxAttendees: event.maxAttendees });
        return res.status(400).json({ message: "Event is full" });
      }

      // Check if user is already registered for this event
      if (userId) {
        const existingRegistration = await storage.getUserEventRegistration(userId, eventId);
        if (existingRegistration) {
          console.log('User already registered:', { userId, eventId });
          return res.status(400).json({ message: "You are already registered for this event" });
        }
      } else {
        // Check for duplicate registration by email for non-authenticated users
        const existingRegistration = await storage.findEventRegistrationByEmail(eventId, email);
        if (existingRegistration) {
          console.log('Duplicate registration attempt by email:', { eventId, email });
          return res.status(400).json({ message: "Email already registered for this event" });
        }
      }

      console.log('Creating registration...');
      const registration = await storage.createEventRegistration({
        eventId,
        userId, // Will be null for non-authenticated users, or user ID for authenticated users
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        companyName: companyName?.trim(),
        position: position?.trim(),
        phoneNumber: phone?.trim(),
        notes: notes?.trim(),
        registrationType: registrationType || null,
        paymentMethod: paymentMethod || "paylanes",
        paymentAmount: paymentAmount || event.price?.toString() || "0.00",
        paymentStatus: paymentMethod === "cheque" ? "pending" : (parseFloat(paymentAmount || "0") > 0 ? "pending" : "paid"),
      });

      // Handle redirects based on payment method
      let redirectUrl = null;
      if (paymentMethod === "paylanes") {
        // Assuming Paylanes has a specific URL structure or API endpoint
        // This is a placeholder and needs to be replaced with the actual Paylanes integration
        redirectUrl = `https://paylanes.com/pay?amount=${registration.paymentAmount}&reference=${registration.id}`;
      } else if (paymentMethod === "stripe") {
        // Placeholder for Stripe integration
        // redirectUrl = `/stripe-checkout/${registration.id}`;
      }

      console.log('Registration created successfully:', registration.id);
      res.status(201).json({ ...registration, redirectUrl });
    } catch (error: any) {
      console.error("Error creating event registration:", error);
      res.status(500).json({ message: "Failed to create event registration: " + error.message });
    }
  });

  // Document routes
  app.get('/api/documents/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { fileName, category, description } = req.body;

      // Create document record without file upload
      const document = await storage.createDocument({
        userId,
        fileName: fileName || 'Document',
        fileType: 'text/plain',
        fileSize: 0,
        objectPath: '', // No file path needed
        category: category || 'general',
      });

      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Message routes
  app.get('/api/messages/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getUserMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get('/api/messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      res.status(500).json({ message: "Failed to fetch unread message count" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        fromUserId: userId,
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put('/api/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Payment routes
  app.get('/api/payments/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payments = await storage.getUserPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Stripe payment routes - temporarily commented out
  /*
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const { amount, type, eventId, description } = req.body;
      const userId = req.user.id;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId,
          type,
          eventId: eventId || "",
          description: description || "",
        },
      });

      // Create payment record
      await storage.createPayment({
        userId,
        amount: amount.toString(),
        type,
        eventId,
        description,
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe subscription for membership fees
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
        return;
      }

      if (!user.email) {
        return res.status(400).json({ message: "User email is required for subscription" });
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'BACO Membership',
            },
            unit_amount: Math.round(parseFloat(user.annualFee || "350") * 100),
            recurring: {
              interval: 'year',
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      user = await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });
  */

  // Temporary simple payment routes for testing
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    res.status(503).json({ message: "Payment processing temporarily unavailable - Stripe keys needed" });
  });

  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    res.status(503).json({ message: "Subscription processing temporarily unavailable - Stripe keys needed" });
  });



  // Admin: Get event registrations
  app.get('/api/admin/events/:eventId/registrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const registrations = await storage.getEventRegistrations(req.params.eventId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching event registrations:", error);
      res.status(500).json({ message: "Failed to fetch event registrations" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.put('/api/admin/documents/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status } = req.body;
      const document = await storage.updateDocumentStatus(req.params.id, status, userId);
      res.json(document);
    } catch (error) {
      console.error("Error updating document status:", error);
      res.status(500).json({ message: "Failed to update document status" });
    }
  });

  // Member registration endpoint (public)
  app.post('/api/member-registration', async (req, res) => {
    try {
      const {
        registrationType,
        membershipNumber,
        firstName,
        lastName,
        email,
        membershipType,
        agreesToTerms
      } = req.body;

      if (!agreesToTerms) {
        return res.status(400).json({ message: "You must agree to the terms and conditions" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Determine membership fee based on type
      const membershipFees = {
        academic: "100.00",
        associate: "200.00",
        professional: "250.00",
        bccp: "300.00"
      };

      // Create new user with comprehensive data
      const newUser = await storage.createUser({
        email,
        password: "temp123", // Temporary password
        firstName,
        lastName,
        membershipType,
        membershipStatus: registrationType === "existing" ? "active" : "pending",
        isExistingMember: registrationType === "existing",
        membershipNumber: registrationType === "existing" ? membershipNumber : null,
        annualFee: membershipFees[membershipType as keyof typeof membershipFees],
        isAdmin: false
      });

      res.status(201).json({
        message: "Membership application submitted successfully",
        userId: newUser.id,
        membershipType,
        status: newUser.membershipStatus
      });
    } catch (error) {
      console.error("Error processing member registration:", error);
      res.status(500).json({ message: "Failed to process membership application" });
    }
  });

  // Admin: Get all users with detailed info
  app.get('/api/admin/users/detailed', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsersDetailed();
      res.json(users);
    } catch (error) {
      console.error("Error fetching detailed users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin: Update user admin status
  app.put('/api/admin/users/:userId/admin-status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { isAdmin } = req.body;

      const updatedUser = await storage.updateUserAdminStatus(userId, isAdmin);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  // Admin: Delete user
  app.delete('/api/admin/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === req.user?.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: error.message || "Failed to delete user" });
    }
  });

  // Temporary endpoint to make current user admin (for testing)
  app.post('/api/make-me-admin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Get existing user and update admin status
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = await storage.updateUser(userId, { isAdmin: true });
      res.json({ message: "You are now an admin", user });
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ message: "Failed to make user admin" });
    }
  });

  // Endpoint to create/seed the BACO Conference 2025 event
  app.post('/api/seed-baco-conference-2025', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Check if event already exists
      const existingEvent = await storage.getEvent("baco-conference-2025");
      if (existingEvent) {
        return res.json({ message: "BACO Conference 2025 event already exists", event: existingEvent });
      }

      const eventData = {
        id: "baco-conference-2025",
        title: "BACO Conference 2025 – Celebrating 25 Years of Compliance",
        slug: "baco-conference-2025",
        description: "Rooted in Integrity, Growing with Purpose",
        startDate: new Date("2025-11-13T08:00:00"),
        endDate: new Date("2025-11-14T17:00:00"),
        location: "Bahamar Convention Center, Nassau, Bahamas",
        price: "350.00",
        maxAttendees: 500,
        currentAttendees: 0,
        status: "upcoming",
        isPublic: true,
        createdBy: userId,
      };

      const event = await storage.createEventWithId(eventData);
      res.json({ message: "BACO Conference 2025 event created successfully", event });
    } catch (error) {
      console.error("Error creating BACO Conference 2025 event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // QR Code generation endpoint
  app.post("/api/generate-qr-code", isAuthenticated, async (req: any, res) => {
    try {
      const { url, title } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      });

      res.json({
        qrCode: qrCodeDataUrl,
        url: url,
        title: title || 'Event QR Code'
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });






  const httpServer = createServer(app);
  return httpServer;
}