import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertEventSchema, insertDocumentSchema, insertMessageSchema, updateEventRegistrationAdminSchema } from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";
import { SupabaseStorageService } from "./awsStorage";
import { sendEventRegistrationConfirmationEmail, sendDocumentApprovalEmail, sendDocumentRejectionEmail, sendCertificateEmail, sendInvoiceEmail } from "./email";
import { generateCertificatePDF, generateInvoicePDF } from "./pdfGenerator";

// CNG (Cash N' Go) payment gateway config
const cngAuthId = process.env.CNG_AUTH_ID;
const cngApiKey = process.env.CNG_API_KEY;
const cngEndpoint = process.env.CNG_ENDPOINT || "https://paylanes-qa.sprocket.solutions/merchant/web-payment/auth";
const appUrl = process.env.APP_URL || "http://localhost:5000";

if (!cngAuthId || !cngApiKey) {
  console.warn("⚠️ CNG_AUTH_ID or CNG_API_KEY not set - payment processing will be unavailable");
}

// Lightweight server-side audit helper – keep payloads minimal to avoid logging sensitive data
const auditLog = async (event: string, details: Record<string, unknown>, req?: any) => {
  try {
    // Log to console for immediate visibility
    // eslint-disable-next-line no-console
    console.log("[AUDIT]", new Date().toISOString(), event, details);
    
    // Persist to database (fire-and-forget to avoid blocking request handling)
    storage.createAuditLog({
      event,
      userId: details.byUserId as string | undefined,
      targetUserId: details.targetUserId as string | undefined,
      details: JSON.stringify(details),
      ipAddress: req?.ip || req?.socket?.remoteAddress,
    }).catch(() => {
      // Silently fail - audit logging should never break request handling
    });
  } catch {
    // Swallow logging errors – never break request handling
  }
};

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
  registrationClosed: z.boolean().optional().default(false),

});



export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Initialize storage service
  const storageService = new SupabaseStorageService();

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

  // Privacy: bundle of personal data for the authenticated user
  app.get("/api/privacy/my-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const [documentsData, registrations, paymentsData, invoicesData, messagesData] =
        await Promise.all([
          storage.getUserDocuments(userId),
          storage.getUserEventRegistrations(userId),
          storage.getUserPayments(userId),
          storage.getUserInvoices(userId),
          storage.getUserMessages(userId),
        ]);

      // Shape a privacy-focused bundle and avoid internal-only/admin-only fields where possible
      const bundle = {
        generatedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          membershipType: user.membershipType,
          membershipStatus: user.membershipStatus,
          joinDate: user.joinDate,
          nextPaymentDate: user.nextPaymentDate,
          nationality: user.nationality,
          currentEmployer: user.currentEmployer,
        },
        documents: documentsData.map((d) => ({
          id: d.id,
          fileName: d.fileName,
          category: d.category,
          status: d.status,
          uploadDate: d.uploadDate,
        })),
        eventRegistrations: registrations.map((r) => ({
          id: r.id,
          eventId: r.eventId,
          eventTitle: r.event?.title,
          registrationDate: r.registrationDate,
          registrationType: r.registrationType,
          paymentStatus: r.paymentStatus,
          paymentAmount: r.paymentAmount,
        })),
        payments: paymentsData.map((p) => ({
          id: p.id,
          type: p.type,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          paymentDate: p.paymentDate,
          description: p.description,
        })),
        invoices: invoicesData.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.amount,
          status: inv.status,
          createdAt: inv.createdAt,
        })),
        messages: messagesData.map((m) => ({
          id: m.id,
          fromUserId: m.fromUserId,
          toUserId: m.toUserId,
          subject: m.subject,
          sentAt: m.sentAt,
          isRead: m.isRead,
        })),
      };

      auditLog("privacy.myData.downloaded", { userId }, req);
      res.json(bundle);
    } catch (error) {
      console.error("Error generating privacy data export:", error);
      res.status(500).json({ message: "Failed to generate data export" });
    }
  });

  // Privacy: user requests a correction to their data
  app.post("/api/privacy/request-correction", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { details } = req.body as { details?: string };
      if (!details || !details.trim()) {
        return res.status(400).json({ message: "Please provide details of the correction requested" });
      }

      // Reuse messaging system to send a structured request to an admin
      const allUsers = await storage.getAllUsers();
      const admin = allUsers.find((u) => u.isAdmin);
      if (!admin) {
        return res.status(500).json({ message: "No administrator available to receive request" });
      }

      await storage.createMessage({
        fromUserId: userId,
        toUserId: admin.id,
        subject: "Data correction request",
        content: details,
      } as any);

      auditLog("privacy.correction.requested", { userId, toAdminId: admin.id }, req);
      res.status(201).json({ message: "Your correction request has been submitted to BACO." });
    } catch (error) {
      console.error("Error submitting correction request:", error);
      res.status(500).json({ message: "Failed to submit correction request" });
    }
  });

  // Privacy: user requests account deactivation / deletion
  app.post("/api/privacy/request-deletion", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { reason } = req.body as { reason?: string };

      const allUsers = await storage.getAllUsers();
      const admin = allUsers.find((u) => u.isAdmin);
      if (!admin) {
        return res.status(500).json({ message: "No administrator available to receive request" });
      }

      const contentLines = [
        `Member ${user.firstName} ${user.lastName} (${user.email}) has requested account deactivation/deletion from the BACO Portal.`,
      ];
      if (reason && reason.trim()) {
        contentLines.push("", "Reason provided:", reason.trim());
      }

      await storage.createMessage({
        fromUserId: userId,
        toUserId: admin.id,
        subject: "Account deletion/deactivation request",
        content: contentLines.join("\n"),
      } as any);

      auditLog("privacy.deletion.requested", { userId, toAdminId: admin.id }, req);
      res.status(201).json({
        message:
          "Your request has been submitted. BACO may need to retain certain records for legal or audit reasons and will respond to you directly.",
      });
    } catch (error) {
      console.error("Error submitting deletion request:", error);
      res.status(500).json({ message: "Failed to submit deletion request" });
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
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const eventData = apiEventSchema.parse(req.body);
      const slug = eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const eventToCreate = {
        ...eventData,
        createdBy: userId,
        slug,
      };

      const event = await storage.createEvent(eventToCreate);
      res.json(event);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }

      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
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



  app.delete("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteEvent(req.params.id);
      auditLog("event.deleted", { eventId: req.params.id, byUserId: userId }, req);
      res.json({ message: "Event deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting event:", error);

      if (error.message && error.message.includes("existing registrations")) {
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
      const { eventId, fullName, email, companyName, position, notes, phone, registrationType, paymentMethod, paymentAmount } = req.body;

      // Validate required fields
      if (!eventId || !fullName || !email) {
        return res.status(400).json({ message: "Missing required fields: eventId, fullName, email" });
      }

      // Split fullName into firstName and lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if user is authenticated (optional for public events)
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.id) {
        userId = req.user.id;
      }

      // Validate event exists and is public
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (!event.isPublic) {
        return res.status(403).json({ message: "Event is not public" });
      }

      // Check if event is full
      if (event.maxAttendees && (event.currentAttendees || 0) >= event.maxAttendees) {
        return res.status(400).json({ message: "Event is full" });
      }

      // Check if user is already registered for this event
      if (userId) {
        const existingRegistration = await storage.getUserEventRegistration(userId, eventId);
        if (existingRegistration) {
          return res.status(200).json({ 
            ...existingRegistration, 
            alreadyRegistered: true,
            message: "You're already registered for this event!"
          });
        }
      } else {
        // Check for duplicate registration by email for non-authenticated users
        const existingRegistration = await storage.findEventRegistrationByEmail(eventId, email);
        if (existingRegistration) {
          return res.status(200).json({ 
            ...existingRegistration, 
            alreadyRegistered: true,
            message: "You're already registered for this event!"
          });
        }
      }

      const registration = await storage.createEventRegistration({
        eventId,
        userId,
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
        redirectUrl = `https://paylanes.com/pay?amount=${registration.paymentAmount}&reference=${registration.id}`;
      }
      
      // Send event registration confirmation email (don't block on error)
      if (event) {
        sendEventRegistrationConfirmationEmail(
          registration.email,
          { title: event.title, startDate: event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate, location: event.location || undefined },
          { firstName: registration.firstName, lastName: registration.lastName, registrationType: registration.registrationType || undefined }
        ).catch(() => {});
      }
      
      res.status(201).json({ ...registration, redirectUrl });
    } catch (error: any) {
      console.error("Error creating event registration:", error);
      res.status(500).json({ message: "Failed to create event registration" });
    }
  });

  // Storage/Upload routes
  app.post('/api/objects/upload', isAuthenticated, async (req: any, res) => {
    try {
      const { fileType } = req.body;
      const { uploadURL, objectPath } = await storageService.getUploadURL(fileType);
      res.json({ uploadURL, objectPath });
    } catch (error: any) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
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

  app.put('/api/documents/upload', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { fileName, fileType, fileSize, objectURL, category } = req.body;

      if (!objectURL) {
        return res.status(400).json({ message: "Object URL is required" });
      }

      // Extract object path from URL if it's a full URL, otherwise use as-is
      let objectPath = objectURL;
      if (objectURL.startsWith('http')) {
        // Extract path from Supabase URL
        // Supabase URLs format: https://...storage.supabase.co/storage/v1/s3/bucket/path/to/file
        const urlObj = new URL(objectURL);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        // Find the path after the bucket name (usually 'uploads/...')
        const bucketIndex = pathParts.findIndex(p => p.includes('bucket') || p.includes('uploads'));
        if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
          // Get everything after the bucket
          objectPath = pathParts.slice(bucketIndex + 1).join('/');
        } else {
          // Fallback: get last two path segments
          objectPath = pathParts.slice(-2).join('/');
        }
      }

      const document = await storage.createDocument({
        userId,
        fileName: fileName || 'Uploaded Document',
        fileType: fileType || 'application/octet-stream',
        fileSize: fileSize || 0,
        objectPath: objectPath,
        category: category || 'other',
      });
      res.json(document);
    } catch (error: any) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document: " + error.message });
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
      const user = await storage.getUser(userId);
      let { toUserId, subject, content } = req.body;

      // If member is sending and no toUserId provided, find an admin
      if (!user?.isAdmin && !toUserId) {
        const allUsers = await storage.getAllUsers();
        const admin = allUsers.find(u => u.isAdmin);
        if (!admin) {
          return res.status(404).json({ message: "No administrator found" });
        }
        toUserId = admin.id;
      }

      // Validate recipient
      const recipient = await storage.getUser(toUserId);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }

      // Members can only message admins, admins can message anyone
      if (!user?.isAdmin && !recipient.isAdmin) {
        return res.status(403).json({ message: "Members can only message administrators" });
      }

      const messageData = insertMessageSchema.parse({
        toUserId,
        subject,
        content,
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

  // Activity feed endpoint
  app.get('/api/activity/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activities = await storage.getUserActivity(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
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

  // CNG (Cash N' Go) payment routes
  app.post('/api/cng/create-payment', isAuthenticated, async (req: any, res) => {
    if (!cngAuthId || !cngApiKey) {
      return res.status(503).json({ message: "Payment processing unavailable - CNG not configured" });
    }

    try {
      const { amount, type, eventId, description } = req.body;
      const userId = req.user.id;

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < 1) {
        return res.status(400).json({ message: "Amount must be at least 1.00" });
      }

      // For event payments, ensure an event registration exists (create pending if not) so callback can update it
      let registrationCreated = false;
      if (type === "event" && eventId) {
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }
        let registration = await storage.getUserEventRegistration(userId, eventId);
        if (!registration) {
          const user = await storage.getUser(userId);
          if (!user) {
            return res.status(401).json({ message: "User not found" });
          }
          registration = await storage.createEventRegistration({
            eventId,
            userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            paymentMethod: "paylanes",
            paymentAmount: amountNum.toFixed(2),
            paymentStatus: "pending",
          });
          registrationCreated = true;
        }
      }

      const orderNumber = `BACO-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      await storage.createPayment({
        userId,
        amount: amountNum.toFixed(2),
        type,
        eventId: eventId || undefined,
        description: description || "",
        orderNumber,
        status: "pending",
      });

      // CNG appends query params (ORDER_NUMBER, STATUS, PAYMENT_ID, etc.) to callback URLs per documentation
      const baseUrl = appUrl.replace(/\/$/, "");
      const urlSuccess = `${baseUrl}/api/cng/callback`;
      const urlCancel = `${baseUrl}/api/cng/callback`;

      const params = new URLSearchParams({
        AUTH_ID: cngAuthId,
        API_KEY: cngApiKey,
        AMOUNT: amountNum.toFixed(2),
        URL_SUCCESS: urlSuccess,
        URL_CANCEL: urlCancel,
        ORDER_NUMBER: orderNumber,
        PAYMENT_OPTIONS: "card,mmx,cng,sd",
      });

      const redirectUrl = `${cngEndpoint}?${params.toString()}`;

      // Store order in session so callback can recover if CNG redirects without query params (e.g. sandbox quirk)
      if (req.session) {
        (req.session as any).pendingCngOrderNumber = orderNumber;
      }

      res.json({ redirectUrl, orderNumber });
    } catch (error: any) {
      console.error("Error creating CNG payment:", error);
      res.status(500).json({ message: "Error creating payment: " + error.message });
    }
  });

  // CNG callback - CNG redirects user here after payment; we update payment and redirect to frontend
  app.get('/api/cng/callback', async (req: any, res) => {
    try {
      // CNG appends ORDER_NUMBER, STATUS, etc.; support both casing in case gateway varies
      let orderNumber = (req.query.ORDER_NUMBER ?? req.query.order_number) as string | undefined;
      const status = (req.query.STATUS ?? req.query.status) as string | undefined;
      const paymentId = (req.query.PAYMENT_ID ?? req.query.payment_id) as string | undefined;
      const paymentPlatform = (req.query.PAYMENT_PLATFORM ?? req.query.payment_platform) as string | undefined;

      // Fallback: CNG sandbox (and some gateways) may redirect with no query params; recover order from session
      if (!orderNumber?.trim() && req.session) {
        const pending = (req.session as any).pendingCngOrderNumber as string | undefined;
        if (pending?.trim()) {
          orderNumber = pending;
          delete (req.session as any).pendingCngOrderNumber;
          if (process.env.NODE_ENV === "development") {
            console.warn("[CNG callback] No query params; using order from session:", orderNumber);
          }
        }
      }

      if (!orderNumber?.trim()) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[CNG callback] Missing ORDER_NUMBER. Query:", JSON.stringify(req.query));
        }
        return res.redirect(`${appUrl}/payment/cancel?error=missing_order`);
      }

      const payment = await storage.getPaymentByOrderNumber(orderNumber.trim());
      if (!payment) {
        return res.redirect(`${appUrl}/payment/cancel?error=unknown_order`);
      }

      if (status === "PAID") {
        await storage.updatePaymentByOrderNumber(orderNumber.trim(), "completed", paymentId, paymentPlatform || undefined);
        if (payment.type === "membership" || payment.type === "subscription") {
          await storage.updateUserMembershipStatus(payment.userId, "active");
        }
        if (payment.type === "event" && payment.eventId) {
          const registration = await storage.getUserEventRegistration(payment.userId, payment.eventId);
          if (registration) {
            await storage.updateEventRegistrationPayment(registration.id, "paid", paymentId);
          }
        }
        return res.redirect(`${appUrl}/payment/success?order=${encodeURIComponent(orderNumber.trim())}`);
      }

      if (status === "CANCELLED") {
        await storage.updatePaymentByOrderNumber(orderNumber.trim(), "failed");
        return res.redirect(`${appUrl}/payment/cancel?order=${encodeURIComponent(orderNumber.trim())}`);
      }

      // No STATUS from CNG (e.g. sandbox redirects with empty query) – we recovered order from session but can't confirm result
      if (!status) {
        return res.redirect(`${appUrl}/payment/cancel?error=verification_pending&order=${encodeURIComponent(orderNumber.trim())}`);
      }

      if (process.env.NODE_ENV === "development") {
        console.warn("[CNG callback] Unrecognized status. Query:", JSON.stringify(req.query));
      }
      return res.redirect(`${appUrl}/payment/cancel?error=unknown_status`);
    } catch (error: any) {
      console.error("Error in CNG callback:", error);
      return res.redirect(`${appUrl}/payment/cancel?error=server_error`);
    }
  });

  // CNG callback POST handler - some gateways POST the callback data
  app.post('/api/cng/callback', async (req: any, res) => {
    try {
      // CNG might POST the data instead of using query params
      let orderNumber = (req.body.ORDER_NUMBER ?? req.body.order_number) as string | undefined;
      const status = (req.body.STATUS ?? req.body.status) as string | undefined;
      const paymentId = (req.body.PAYMENT_ID ?? req.body.payment_id) as string | undefined;
      const paymentPlatform = (req.body.PAYMENT_PLATFORM ?? req.body.payment_platform) as string | undefined;

      if (!orderNumber?.trim() && req.session) {
        const pending = (req.session as any).pendingCngOrderNumber as string | undefined;
        if (pending?.trim()) {
          orderNumber = pending;
          delete (req.session as any).pendingCngOrderNumber;
        }
      }

      if (!orderNumber?.trim()) {
        return res.redirect(`${appUrl}/payment/cancel?error=missing_order`);
      }

      const payment = await storage.getPaymentByOrderNumber(orderNumber.trim());
      if (!payment) {
        return res.redirect(`${appUrl}/payment/cancel?error=unknown_order`);
      }

      if (status === "PAID") {
        await storage.updatePaymentByOrderNumber(orderNumber.trim(), "completed", paymentId, paymentPlatform || undefined);
        if (payment.type === "membership" || payment.type === "subscription") {
          await storage.updateUserMembershipStatus(payment.userId, "active");
        }
        if (payment.type === "event" && payment.eventId) {
          const registration = await storage.getUserEventRegistration(payment.userId, payment.eventId);
          if (registration) {
            await storage.updateEventRegistrationPayment(registration.id, "paid", paymentId);
          }
        }
        return res.redirect(`${appUrl}/payment/success?order=${encodeURIComponent(orderNumber.trim())}`);
      }

      if (status === "CANCELLED") {
        await storage.updatePaymentByOrderNumber(orderNumber.trim(), "failed");
        return res.redirect(`${appUrl}/payment/cancel?order=${encodeURIComponent(orderNumber.trim())}`);
      }

      // No status - use session fallback for pending verification
      return res.redirect(`${appUrl}/payment/cancel?error=verification_pending&order=${encodeURIComponent(orderNumber.trim())}`);
    } catch (error: any) {
      console.error("Error in CNG callback POST:", error);
      return res.redirect(`${appUrl}/payment/cancel?error=server_error`);
    }
  });

  // CNG success callback - user completed payment
  app.get('/api/cng/callback/success', async (req: any, res) => {
    try {
      // Try to get order from query params (if CNG sends them) or session
      let orderNumber = (req.query.ORDER_NUMBER ?? req.query.order_number) as string | undefined;
      const paymentId = (req.query.PAYMENT_ID ?? req.query.payment_id) as string | undefined;
      const paymentPlatform = (req.query.PAYMENT_PLATFORM ?? req.query.payment_platform) as string | undefined;

      if (!orderNumber?.trim() && req.session) {
        const pending = (req.session as any).pendingCngOrderNumber as string | undefined;
        if (pending?.trim()) {
          orderNumber = pending;
          delete (req.session as any).pendingCngOrderNumber;
        }
      }

      if (!orderNumber?.trim()) {
        return res.redirect(`${appUrl}/payment/cancel?error=missing_order`);
      }

      const payment = await storage.getPaymentByOrderNumber(orderNumber.trim());
      if (!payment) {
        return res.redirect(`${appUrl}/payment/cancel?error=unknown_order`);
      }

      // SUCCESS: Update payment as completed
      await storage.updatePaymentByOrderNumber(orderNumber.trim(), "completed", paymentId, paymentPlatform || undefined);

      if (payment.type === "membership" || payment.type === "subscription") {
        await storage.updateUserMembershipStatus(payment.userId, "active");
      }
      if (payment.type === "event" && payment.eventId) {
        const registration = await storage.getUserEventRegistration(payment.userId, payment.eventId);
        if (registration) {
          await storage.updateEventRegistrationPayment(registration.id, "paid", paymentId);
        }
      }

      return res.redirect(`${appUrl}/payment/success?order=${encodeURIComponent(orderNumber.trim())}`);
    } catch (error: any) {
      console.error("Error in CNG success callback:", error);
      return res.redirect(`${appUrl}/payment/cancel?error=server_error`);
    }
  });

  // CNG cancel callback - user cancelled payment
  app.get('/api/cng/callback/cancel', async (req: any, res) => {
    try {
      // Try to get order from query params or session
      let orderNumber = (req.query.ORDER_NUMBER ?? req.query.order_number) as string | undefined;

      if (!orderNumber?.trim() && req.session) {
        const pending = (req.session as any).pendingCngOrderNumber as string | undefined;
        if (pending?.trim()) {
          orderNumber = pending;
          delete (req.session as any).pendingCngOrderNumber;
        }
      }

      if (orderNumber?.trim()) {
        await storage.updatePaymentByOrderNumber(orderNumber.trim(), "failed");
      }

      return res.redirect(`${appUrl}/payment/cancel${orderNumber ? `?order=${encodeURIComponent(orderNumber.trim())}` : ''}`);
    } catch (error: any) {
      console.error("Error in CNG cancel callback:", error);
      return res.redirect(`${appUrl}/payment/cancel?error=server_error`);
    }
  });

  // Check if CNG is available
  app.get('/api/cng/status', (req, res) => {
    res.json({ available: !!(cngAuthId && cngApiKey) });
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

  // Admin: Export event registrations as CSV
  app.get('/api/admin/events/:eventId/registrations/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const registrations = await storage.getEventRegistrations(req.params.eventId);
      const event = await storage.getEvent(req.params.eventId);

      // Helper function to escape CSV field
      const escapeCSVField = (field: any): string => {
        if (field === null || field === undefined) return '""';
        const str = String(field);
        // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return `"${str}"`;
      };

      // CSV headers
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Position',
        'Phone Number',
        'Registration Type',
        'Payment Method',
        'Payment Status',
        'Payment Amount',
        'Registration Date',
        'Notes'
      ];

      // Convert registrations to CSV rows
      const csvRows = registrations.map(reg => [
        escapeCSVField(reg.firstName || ''),
        escapeCSVField(reg.lastName || ''),
        escapeCSVField(reg.email || ''),
        escapeCSVField(reg.position || ''),
        escapeCSVField(reg.phoneNumber || ''),
        escapeCSVField(reg.registrationType || ''),
        escapeCSVField(reg.paymentMethod || ''),
        escapeCSVField(reg.paymentStatus || ''),
        escapeCSVField(reg.paymentAmount || ''),
        escapeCSVField(reg.registrationDate ? new Date(reg.registrationDate).toISOString() : ''),
        escapeCSVField(reg.notes || '')
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.map(h => escapeCSVField(h)).join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Set headers for file download
      const filename = `${event?.title.replace(/[^a-z0-9]/gi, '_')}_registrations_${new Date().toISOString().split("T")[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(csvContent);
      auditLog("event.registrations.exported", {
        eventId: req.params.eventId,
        byUserId: userId,
        registrationsCount: registrations.length,
        reason: (req.query?.reason as string) || undefined,
      }, req);
    } catch (error) {
      console.error("Error exporting event registrations:", error);
      res.status(500).json({ message: "Failed to export event registrations" });
    }
  });

  // Admin: Update event registration admin fields
  app.patch('/api/admin/event-registrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Validate request body with Zod
      const validationResult = updateEventRegistrationAdminSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.flatten()
        });
      }

      const registration = await storage.updateEventRegistration(req.params.id, validationResult.data);
      res.json(registration);
    } catch (error) {
      console.error("Error updating event registration:", error);
      res.status(500).json({ message: "Failed to update event registration" });
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

      const { status, reason } = req.body;
      const document = await storage.updateDocumentStatus(req.params.id, status, userId);
      auditLog("document.status.updated", {
        documentId: req.params.id,
        newStatus: status,
        byUserId: userId,
      }, req);
      
      // Send email notification based on status
      const docUser = await storage.getUser(document.userId);
      if (docUser?.email) {
        if (status === 'approved') {
          sendDocumentApprovalEmail(docUser.email, { fileName: document.fileName, category: document.category || undefined }).catch((err) => {
            console.error('Failed to send document approval email:', err);
          });
        } else if (status === 'rejected') {
          sendDocumentRejectionEmail(docUser.email, { fileName: document.fileName, category: document.category || undefined }, reason).catch((err) => {
            console.error('Failed to send document rejection email:', err);
          });
        }
      }
      
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

  // Admin: Get all messages (conversations with members)
  app.get('/api/admin/messages', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allMessages = await storage.getAllMessages();
      // Filter to show only admin-member conversations
      const adminMessages = allMessages.filter(msg => 
        msg.fromUser.isAdmin || msg.toUser.isAdmin
      );
      res.json(adminMessages);
    } catch (error) {
      console.error("Error fetching admin messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Admin: Reply to member message
  app.post('/api/admin/messages/reply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { toUserId, subject, content, originalMessageId } = req.body;
      
      if (!toUserId || !content) {
        return res.status(400).json({ message: "Recipient and content are required" });
      }

      const messageData = insertMessageSchema.parse({
        toUserId,
        subject: subject || `Re: ${req.body.originalSubject || 'Message'}`,
        content,
        fromUserId: userId,
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error replying to message:", error);
      res.status(500).json({ message: "Failed to send reply" });
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
      auditLog("user.adminStatus.updated", {
        targetUserId: userId,
        newIsAdmin: isAdmin,
        byUserId: req.user?.id,
      }, req);
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
      auditLog("user.deleted", {
        targetUserId: userId,
        byUserId: req.user?.id,
      }, req);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: error.message || "Failed to delete user" });
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
        currentAttendees: 184,
        status: "upcoming",
        isPublic: true,
        registrationClosed: true, // Registration is closed
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

  // Certificate Template Endpoints (Admin Only)
  app.post('/api/admin/certificate-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { name, description, templateImagePath, textConfig } = req.body;

      if (!name || !templateImagePath) {
        return res.status(400).json({ message: "Name and template image path are required" });
      }

      const template = await storage.createCertificateTemplate({
        name,
        description,
        templateImagePath,
        textConfig: textConfig || null,
        isActive: true,
        createdBy: userId,
      });

      res.json(template);
    } catch (error: any) {
      console.error("Error creating certificate template:", error);
      res.status(500).json({ message: "Failed to create certificate template: " + error.message });
    }
  });

  app.get('/api/admin/certificate-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const templates = await storage.getCertificateTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching certificate templates:", error);
      res.status(500).json({ message: "Failed to fetch certificate templates" });
    }
  });

  app.delete('/api/admin/certificate-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteCertificateTemplate(req.params.id);
      res.json({ message: "Certificate template deleted successfully" });
    } catch (error) {
      console.error("Error deleting certificate template:", error);
      res.status(500).json({ message: "Failed to delete certificate template" });
    }
  });

  // Certificate Generation Endpoint (Admin Only)
  app.post('/api/admin/certificates/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { memberId, templateId, name, date, logoPath, cpdHours } = req.body;

      if (!memberId || !templateId || !name || !date || cpdHours === undefined) {
        return res.status(400).json({ message: "Member ID, template ID, name, date, and CPD hours are required" });
      }

      // Get template
      const template = await storage.getCertificateTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Certificate template not found" });
      }

      // Get member
      const member = await storage.getUser(memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Generate PDF
      const pdfBuffer = await generateCertificatePDF({
        templateImagePath: template.templateImagePath,
        name,
        date,
        logoPath,
        cpdHours: parseFloat(cpdHours),
        textConfig: template.textConfig as any,
      });

      // Upload PDF to storage
      const { uploadURL, objectPath } = await storageService.getUploadURL('application/pdf');
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: pdfBuffer,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload PDF: ${uploadResponse.statusText}`);
      }

      // Create document record
      const fileName = `Certificate_${name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const document = await storage.createDocument({
        userId: memberId,
        fileName,
        fileType: 'application/pdf',
        fileSize: pdfBuffer.length,
        objectPath,
        category: 'certificate',
        status: 'approved', // Auto-approved since admin generated it
        verifiedBy: userId,
      });

      // Send email with certificate
      try {
        await sendCertificateEmail(
          member.email,
          pdfBuffer,
          fileName,
          `${member.firstName} ${member.lastName}`
        );
      } catch (emailError) {
        console.error('Failed to send certificate email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        message: "Certificate generated and sent successfully",
        document,
      });
    } catch (error: any) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Failed to generate certificate: " + error.message });
    }
  });

  // Invoice Endpoints
  // Admin: Generate invoice
  app.post('/api/admin/invoices/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { memberId, memberName, memberEmail, placeOfEmployment, companyName, companyEmail, amount, description } = req.body;

      if (!memberId || !memberName || !memberEmail || !amount) {
        return res.status(400).json({ message: "Member ID, name, email, and amount are required" });
      }

      // Generate invoice number
      const invoiceNumber = await storage.generateInvoiceNumber();

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber,
        memberName,
        memberEmail,
        companyName,
        companyEmail,
        placeOfEmployment,
        amount: parseFloat(amount),
        description: description || 'BACO Membership Services',
        date: new Date(),
      });

      // Upload PDF to storage
      const { uploadURL, objectPath } = await storageService.getUploadURL('application/pdf');
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: pdfBuffer,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload PDF: ${uploadResponse.statusText}`);
      }

      // Create invoice record
      const invoice = await storage.createInvoice({
        invoiceNumber,
        userId: memberId,
        memberName,
        memberEmail,
        placeOfEmployment,
        companyName,
        companyEmail,
        amount: amount.toString(),
        description: description || 'BACO Membership Services',
        status: 'sent',
        pdfPath: objectPath,
        generatedBy: userId,
        isAdminGenerated: true,
      });

      // Send email with invoice
      try {
        const fileName = `Invoice_${invoiceNumber}.pdf`;
        await sendInvoiceEmail(
          memberEmail,
          companyEmail,
          pdfBuffer,
          fileName,
          invoiceNumber,
          memberName,
          parseFloat(amount)
        );
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        message: "Invoice generated and sent successfully",
        invoice,
      });
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ message: "Failed to generate invoice: " + error.message });
    }
  });

  // Admin: Get all invoices
  app.get('/api/admin/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Member: Request/Generate invoice (self-service)
  app.post('/api/invoices/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { placeOfEmployment, companyName, companyEmail, amount, description } = req.body;

      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      // Generate invoice number
      const invoiceNumber = await storage.generateInvoiceNumber();

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber,
        memberName: `${user.firstName} ${user.lastName}`,
        memberEmail: user.email,
        companyName,
        companyEmail,
        placeOfEmployment,
        amount: parseFloat(amount),
        description: description || 'BACO Membership Services',
        date: new Date(),
      });

      // Upload PDF to storage
      const { uploadURL, objectPath } = await storageService.getUploadURL('application/pdf');
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: pdfBuffer,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload PDF: ${uploadResponse.statusText}`);
      }

      // Create invoice record
      const invoice = await storage.createInvoice({
        invoiceNumber,
        userId,
        memberName: `${user.firstName} ${user.lastName}`,
        memberEmail: user.email,
        placeOfEmployment,
        companyName,
        companyEmail,
        amount: amount.toString(),
        description: description || 'BACO Membership Services',
        status: 'sent',
        pdfPath: objectPath,
        generatedBy: userId,
        isAdminGenerated: false,
      });

      // Send email with invoice
      try {
        const fileName = `Invoice_${invoiceNumber}.pdf`;
        await sendInvoiceEmail(
          user.email,
          companyEmail,
          pdfBuffer,
          fileName,
          invoiceNumber,
          `${user.firstName} ${user.lastName}`,
          parseFloat(amount)
        );
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        message: "Invoice generated and sent successfully",
        invoice,
      });
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ message: "Failed to generate invoice: " + error.message });
    }
  });

  // Member: Get their invoices
  app.get('/api/invoices/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invoices = await storage.getUserInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching user invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });






  // Admin: Deactivate user account (soft delete for retention compliance)
  app.post('/api/admin/users/:userId/deactivate', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      
      // Prevent admin from deactivating themselves
      if (userId === req.user?.id) {
        return res.status(400).json({ message: "You cannot deactivate your own account" });
      }

      const deactivatedUser = await storage.deactivateUser(userId);
      auditLog("user.deactivated", {
        targetUserId: userId,
        byUserId: req.user?.id,
      });
      res.json({ message: "User account deactivated successfully", user: deactivatedUser });
    } catch (error: any) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: error.message || "Failed to deactivate user" });
    }
  });

  // Admin: Run retention purge script (manual trigger)
  app.post('/api/admin/retention/purge', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Import and run the purge function
      const { purgeRetentionData } = await import("../scripts/purge-retention-data");
      const stats = await purgeRetentionData();
      
      auditLog("retention.purge.executed", {
        byUserId: req.user?.id,
        stats,
      }, req);
      
      res.json({
        message: "Retention purge completed successfully",
        stats,
      });
    } catch (error: any) {
      console.error("Error running retention purge:", error);
      res.status(500).json({ message: error.message || "Failed to run retention purge" });
    }
  });

  // Compliance Dashboard Endpoints

  // GET /api/admin/audit-logs - Paginated audit log with filters
  app.get('/api/admin/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const event = req.query.event as string | undefined;
      const userId = req.query.userId as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const logs = await storage.getAuditLogs(
        { event, userId, startDate, endDate },
        limit,
        offset
      );

      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: error.message || "Failed to fetch audit logs" });
    }
  });

  // GET /api/admin/dsr-requests - Data Subject Requests (messages with correction/deletion keywords)
  app.get('/api/admin/dsr-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allMessages = await storage.getAllMessages();
      // Filter messages that are likely data subject requests
      const dsrMessages = allMessages.filter(msg => {
        const subject = (msg.subject || "").toLowerCase();
        const content = (msg.content || "").toLowerCase();
        return subject.includes("correction") || 
               subject.includes("deletion") || 
               subject.includes("deactivate") ||
               content.includes("data correction") ||
               content.includes("delete my account") ||
               content.includes("deactivate my account");
      });

      res.json(dsrMessages);
    } catch (error: any) {
      console.error("Error fetching DSR requests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch DSR requests" });
    }
  });

  // GET /api/admin/retention/stats - Retention statistics
  app.get('/api/admin/retention/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getRetentionStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching retention stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch retention stats" });
    }
  });

  // GET /api/admin/consent-stats - Marketing consent statistics
  app.get('/api/admin/consent-stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getConsentStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching consent stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch consent stats" });
    }
  });

  // GET /api/admin/users/deleted - List of soft-deleted/deactivated users
  app.get('/api/admin/users/deleted', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const deletedUsers = await storage.getDeletedUsers();
      res.json(deletedUsers);
    } catch (error: any) {
      console.error("Error fetching deleted users:", error);
      res.status(500).json({ message: error.message || "Failed to fetch deleted users" });
    }
  });

  // POST /api/admin/users/:id/restore - Restore a soft-deleted user
  app.post('/api/admin/users/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const restoredUser = await storage.restoreUser(id);
      
      auditLog("user.restored", {
        targetUserId: id,
        byUserId: req.user?.id,
      }, req);

      res.json({ message: "User account restored successfully", user: restoredUser });
    } catch (error: any) {
      console.error("Error restoring user:", error);
      res.status(500).json({ message: error.message || "Failed to restore user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}