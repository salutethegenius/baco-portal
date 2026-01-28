import {
  users,
  events,
  eventRegistrations,
  documents,
  messages,
  payments,
  certificateTemplates,
  invoices,
  auditLogs,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type EventRegistration,
  type InsertEventRegistration,
  type Document,
  type InsertDocument,
  type Message,
  type InsertMessage,
  type Payment,
  type InsertPayment,
  type CertificateTemplate,
  type InsertCertificateTemplate,
  type Invoice,
  type InsertInvoice,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, count, sql, gte, lte, isNotNull } from "drizzle-orm";
import { generateSlug, ensureUniqueSlug } from "@shared/utils";
import crypto from "crypto";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  getAllUsersDetailed(): Promise<User[]>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserMembershipStatus(userId: string, status: string, nextPaymentDate?: Date): Promise<User>;
  updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  deactivateUser(userId: string): Promise<User>;
  anonymiseUser(userId: string): Promise<void>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  createEventWithId(eventData: any): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;


  // Event registration operations
  getEventRegistrations(eventId: string): Promise<EventRegistration[]>;
  getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]>;
  getUserEventRegistration(userId: string, eventId: string): Promise<EventRegistration | undefined>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateEventRegistrationPayment(id: string, paymentStatus: string, stripePaymentIntentId?: string): Promise<EventRegistration>;
  updateEventRegistration(id: string, updates: Partial<EventRegistration>): Promise<EventRegistration>;

  // Document operations
  getUserDocuments(userId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocumentStatus(id: string, status: string, verifiedBy?: string): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  // Message operations
  getUserMessages(userId: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Payment operations
  getUserPayments(userId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: string): Promise<Payment>;
  updatePaymentByStripeId(stripePaymentIntentId: string, status: string): Promise<Payment | undefined>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllDocuments(): Promise<(Document & { user: User })[]>;
  getAllMessages(): Promise<(Message & { fromUser: User; toUser: User })[]>;
  getUserStats(): Promise<{ totalMembers: number; activeMembers: number; pendingDocuments: number; }>;
  
  // Activity operations
  getUserActivity(userId: string): Promise<any[]>;

  // Certificate template operations
  getCertificateTemplates(): Promise<CertificateTemplate[]>;
  getCertificateTemplate(id: string): Promise<CertificateTemplate | undefined>;
  createCertificateTemplate(template: InsertCertificateTemplate): Promise<CertificateTemplate>;
  updateCertificateTemplate(id: string, template: Partial<InsertCertificateTemplate>): Promise<CertificateTemplate>;
  deleteCertificateTemplate(id: string): Promise<void>;

  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getUserInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  generateInvoiceNumber(): Promise<string>;

  // Compliance operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { event?: string; userId?: string; startDate?: Date; endDate?: Date }, limit?: number, offset?: number): Promise<AuditLog[]>;
  getDeletedUsers(): Promise<User[]>;
  restoreUser(userId: string): Promise<User>;
  getRetentionStats(): Promise<{ active: number; softDeleted: number; anonymized: number; upcomingPurge: number }>;
  getConsentStats(): Promise<{ optedIn: number; optedOut: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), sql`${users.deletedAt} IS NULL`));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), sql`${users.deletedAt} IS NULL`));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          sql`${users.passwordResetExpires} > NOW()`
        )
      );
    return user;
  }

  async setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllUsersDetailed(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(sql`${users.deletedAt} IS NULL`)
      .orderBy(desc(users.createdAt));
  }

  async updateUser(userId: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    // Soft delete: mark as deleted rather than hard delete for retention compliance
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async deactivateUser(userId: string): Promise<User> {
    // Soft-delete user account (marks as deleted but keeps data for retention period)
    const [updatedUser] = await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async anonymiseUser(userId: string): Promise<void> {
    // Anonymise user data while keeping records for audit/legal purposes
    // This is used when retention period expires but legal obligations require keeping records
    const anonymisedEmail = `deleted_${userId.slice(0, 8)}_${Date.now()}@deleted.baco`;
    await db
      .update(users)
      .set({
        email: anonymisedEmail,
        firstName: "Deleted",
        lastName: "User",
        phone: null,
        address: null,
        homeAddress: null,
        businessAddress: null,
        password: crypto.randomBytes(32).toString("hex"), // Invalidate password
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserMembershipStatus(userId: string, status: string, nextPaymentDate?: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        membershipStatus: status,
        nextPaymentDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.startDate));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Generate unique slug from title
    const baseSlug = generateSlug(event.title);
    const existingEvents = await db.select({ slug: events.slug }).from(events);
    const existingSlugs = existingEvents.map(e => e.slug).filter(Boolean) as string[];
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

    const [newEvent] = await db.insert(events).values({
      ...event,
      slug: uniqueSlug,
    }).returning();
    return newEvent;
  }

  async createEventWithId(eventData: any): Promise<Event> {
    const [newEvent] = await db.insert(events).values(eventData).returning();
    return newEvent;
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.slug, slug));
    return event;
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(eventId: string): Promise<void> {
    // First check if event has registrations
    const registrations = await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));

    if (registrations.length > 0) {
      throw new Error(`Cannot delete event with ${registrations.length} existing registrations. Please contact registrants first.`);
    }

    await db.delete(events).where(eq(events.id, eventId));
  }



  // Event registration operations
  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }

  async findEventRegistrationByEmail(eventId: string, email: string): Promise<any> {
    const results = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.email, email.toLowerCase())
        )
      )
      .limit(1);

    return results[0] || null;
  }

  async getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]> {
    const results = await db
      .select()
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.userId, userId))
      .orderBy(desc(events.startDate));

    // Transform the joined results to match the expected type
    return results.map(result => ({
      ...result.event_registrations,
      event: result.events
    }));
  }

  async getUserEventRegistration(userId: string, eventId: string): Promise<EventRegistration | undefined> {
    const [registration] = await db
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.userId, userId), eq(eventRegistrations.eventId, eventId)));
    return registration;
  }

  async createEventRegistration(data: {
    eventId: string;
    userId?: string | null;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string;
    position?: string;
    phoneNumber?: string;
    notes?: string;
    registrationType?: string | null;
    paymentMethod?: string;
    paymentAmount?: string;
    paymentStatus?: string;
  }): Promise<EventRegistration> {
    // Create the registration
    const [registration] = await db
      .insert(eventRegistrations)
      .values({
        eventId: data.eventId,
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        position: data.position,
        phoneNumber: data.phoneNumber,
        notes: data.notes,
        registrationType: data.registrationType,
        paymentMethod: data.paymentMethod || "paylanes",
        paymentAmount: data.paymentAmount || "0.00",
        paymentStatus: data.paymentStatus || "pending",
      })
      .returning();

    // Update event's current attendee count
    const currentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, data.eventId));

    await db
      .update(events)
      .set({ currentAttendees: currentCount[0].count })
      .where(eq(events.id, data.eventId));

    return registration;
  }

  async updateEventRegistrationPayment(id: string, paymentStatus: string, stripePaymentIntentId?: string): Promise<EventRegistration> {
    const [registration] = await db
      .update(eventRegistrations)
      .set({
        paymentStatus,
        stripePaymentIntentId,
      })
      .where(eq(eventRegistrations.id, id))
      .returning();
    return registration;
  }

  async updateEventRegistration(id: string, updates: Partial<EventRegistration>): Promise<EventRegistration> {
    const [registration] = await db
      .update(eventRegistrations)
      .set(updates)
      .where(eq(eventRegistrations.id, id))
      .returning();
    return registration;
  }

  // Document operations
  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.uploadDate));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocumentStatus(id: string, status: string, verifiedBy?: string): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({
        status,
        verifiedBy,
        verifiedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Message operations
  async getUserMessages(userId: string): Promise<(Message & { fromUser?: User; toUser?: User })[]> {
    const messageList = await db
      .select()
      .from(messages)
      .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)))
      .orderBy(desc(messages.sentAt));

    // Get user info for all unique user IDs
    const userIds = new Set<string>();
    messageList.forEach(msg => {
      userIds.add(msg.fromUserId);
      userIds.add(msg.toUserId);
    });

    const usersMap = new Map<string, User>();
    for (const uid of Array.from(userIds)) {
      const user = await this.getUser(uid);
      if (user) {
        usersMap.set(uid, user);
      }
    }

    return messageList.map(msg => ({
      ...msg,
      fromUser: usersMap.get(msg.fromUserId),
      toUser: usersMap.get(msg.toUserId),
    }));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(and(eq(messages.toUserId, userId), eq(messages.isRead, false)));
    return result.count;
  }

  // Payment operations
  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async updatePaymentByStripeId(stripePaymentIntentId: string, status: string): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
      .returning();
    return payment;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(sql`${users.deletedAt} IS NULL`)
      .orderBy(desc(users.createdAt));
  }

  async getAllDocuments(): Promise<(Document & { user: User })[]> {
    const results = await db
      .select()
      .from(documents)
      .innerJoin(users, eq(documents.userId, users.id))
      .orderBy(desc(documents.uploadDate));

    return results.map(result => ({
      ...result.documents,
      user: result.users
    }));
  }

  async getAllMessages(): Promise<(Message & { fromUser: User; toUser: User })[]> {
    const messageList = await db
      .select()
      .from(messages)
      .orderBy(desc(messages.sentAt));

    // Get user info for all unique user IDs
    const userIds = new Set<string>();
    messageList.forEach(msg => {
      userIds.add(msg.fromUserId);
      userIds.add(msg.toUserId);
    });

    const usersMap = new Map<string, User>();
    for (const uid of Array.from(userIds)) {
      const user = await this.getUser(uid);
      if (user) {
        usersMap.set(uid, user);
      }
    }

    return messageList.map(msg => ({
      ...msg,
      fromUser: usersMap.get(msg.fromUserId)!,
      toUser: usersMap.get(msg.toUserId)!,
    }));
  }

  async getUserStats(): Promise<{ totalMembers: number; activeMembers: number; pendingDocuments: number; }> {
    const [totalMembersResult] = await db.select({ count: count() }).from(users);
    const [activeMembersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.membershipStatus, 'active'));
    const [pendingDocumentsResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.status, 'pending'));

    return {
      totalMembers: totalMembersResult.count,
      activeMembers: activeMembersResult.count,
      pendingDocuments: pendingDocumentsResult.count,
    };
  }

  async getUserActivity(userId: string): Promise<any[]> {
    const activities: any[] = [];

    // Get event registrations
    const registrations = await db
      .select({
        id: eventRegistrations.id,
        eventTitle: events.title,
        date: eventRegistrations.registrationDate,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.userId, userId))
      .orderBy(desc(eventRegistrations.registrationDate))
      .limit(10);

    activities.push(...registrations.map(r => ({
      type: 'event',
      message: `Registered for ${r.eventTitle}`,
      date: r.date,
      icon: 'calendar',
      color: 'baco-accent',
      timestamp: r.date,
    })));

    // Get document uploads
    const docUploads = await db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        date: documents.uploadDate,
      })
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.uploadDate))
      .limit(10);

    activities.push(...docUploads.map(d => ({
      type: 'document',
      message: `Uploaded ${d.fileName}`,
      date: d.date,
      icon: 'file',
      color: 'baco-primary',
      timestamp: d.date,
    })));

    // Get payments
    const userPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        currency: payments.currency,
        date: payments.paymentDate,
      })
      .from(payments)
      .where(and(
        eq(payments.userId, userId),
        eq(payments.status, 'completed')
      ))
      .orderBy(desc(payments.paymentDate))
      .limit(10);

    activities.push(...userPayments.map(p => ({
      type: 'payment',
      message: `Payment of $${p.amount} ${p.currency} processed`,
      date: p.date,
      icon: 'check',
      color: 'baco-success',
      timestamp: p.date,
    })));

    // Get messages received
    const messagesReceived = await db
      .select({
        id: messages.id,
        subject: messages.subject,
        date: messages.sentAt,
      })
      .from(messages)
      .where(eq(messages.toUserId, userId))
      .orderBy(desc(messages.sentAt))
      .limit(10);

    activities.push(...messagesReceived.map(m => ({
      type: 'message',
      message: `Received message: ${m.subject || 'No subject'}`,
      date: m.date,
      icon: 'envelope',
      color: 'purple-600',
      timestamp: m.date,
    })));

    // Sort by date (most recent first) and limit to 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  // Certificate template operations
  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    return await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.isActive, true))
      .orderBy(desc(certificateTemplates.createdAt));
  }

  async getCertificateTemplate(id: string): Promise<CertificateTemplate | undefined> {
    const [template] = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.id, id));
    return template;
  }

  async createCertificateTemplate(template: InsertCertificateTemplate): Promise<CertificateTemplate> {
    const [newTemplate] = await db
      .insert(certificateTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateCertificateTemplate(id: string, templateData: Partial<InsertCertificateTemplate>): Promise<CertificateTemplate> {
    const [updatedTemplate] = await db
      .update(certificateTemplates)
      .set({
        ...templateData,
        updatedAt: new Date(),
      })
      .where(eq(certificateTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteCertificateTemplate(id: string): Promise<void> {
    await db
      .update(certificateTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(certificateTemplates.id, id));
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt));
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoiceData)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async generateInvoiceNumber(): Promise<string> {
    // Generate invoice number: INV-YYYY-MMDD-XXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Get count of invoices today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayInvoices = await db
      .select({ count: count() })
      .from(invoices)
      .where(sql`${invoices.createdAt} >= ${sql.raw(`'${todayStart.toISOString()}'`)}`);
    
    const sequence = String((todayInvoices[0]?.count || 0) + 1).padStart(4, '0');
    return `INV-${year}-${month}${day}-${sequence}`;
  }

  // This method initializes the database with sample data if it's empty.
  // It ensures that there's at least one admin user and some sample events for testing.
  async initializeDatabase(): Promise<void> {
    // Create sample admin user if none exists
    const adminExists = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
    if (adminExists.length === 0) {
      await db.insert(users).values({
        email: "admin@baco-bahamas.com",
        password: "$2b$10$k8Y5H.F3QjF5O3vGnVgkJuE7K5eZgO8YwK2FzVZ3FQy9G5pK8HqO.", // bcrypt hash of "admin123"
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        membershipStatus: "active",
      });
    }

    // Create sample events if none exist
    const existingEvents = await db.select().from(events).limit(1);
    if (existingEvents.length === 0) {
      const adminUser = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
      const adminId = adminUser.length > 0 ? adminUser[0].id : "admin-user-1";

      const sampleEvents = [
        {
          title: "BACO Annual Conference 2024",
          slug: "baco-annual-conference-2024",
          description: "Join us for our premier annual conference featuring industry experts, networking opportunities, and professional development sessions. This year's theme focuses on emerging compliance challenges in the digital age.",
          startDate: new Date("2024-03-15T09:00:00Z"),
          endDate: new Date("2024-03-15T17:00:00Z"),
          location: "Atlantis Paradise Island, Nassau",
          price: "150.00",
          maxAttendees: 200,
          currentAttendees: 45,
          status: "upcoming",
          createdBy: adminId,
        },
        {
          title: "Regulatory Updates Workshop",
          slug: "regulatory-updates-workshop",
          description: "Stay current with the latest regulatory changes affecting compliance professionals in the Bahamas. Interactive workshop with Q&A sessions.",
          startDate: new Date("2024-02-28T14:00:00Z"),
          endDate: new Date("2024-02-28T16:00:00Z"),
          location: "BACO Training Center, Nassau",
          price: "75.00",
          maxAttendees: 50,
          currentAttendees: 12,
          status: "upcoming",
          createdBy: adminId,
        },
        {
          title: "Monthly Networking Mixer",
          slug: "monthly-networking-mixer",
          description: "Casual networking event for BACO members. Light refreshments provided. Great opportunity to connect with fellow compliance professionals.",
          startDate: new Date("2024-02-20T18:00:00Z"),
          endDate: new Date("2024-02-20T20:00:00Z"),
          location: "British Colonial Hilton, Nassau",
          price: "0.00",
          maxAttendees: 100,
          currentAttendees: 23,
          status: "upcoming",
          createdBy: adminId,
        },
        {
          title: "Anti-Money Laundering Certification",
          slug: "anti-money-laundering-certification",
          description: "Comprehensive AML certification course approved by regulatory authorities. Includes materials and certificate upon completion.",
          startDate: new Date("2024-04-10T09:00:00Z"),
          endDate: new Date("2024-04-11T17:00:00Z"),
          location: "BACO Training Center, Nassau",
          price: "250.00",
          maxAttendees: 30,
          currentAttendees: 8,
          status: "upcoming",
          createdBy: adminId,
        }
      ];

      for (const event of sampleEvents) {
        await db.insert(events).values(event);
      }
    }
  }

  // Compliance operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }

  async getAuditLogs(
    filters?: { event?: string; userId?: string; startDate?: Date; endDate?: Date },
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);

    const conditions = [];
    if (filters?.event) {
      conditions.push(eq(auditLogs.event, filters.event));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(auditLogs.createdAt, filters.endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
  }

  async getDeletedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(isNotNull(users.deletedAt))
      .orderBy(desc(users.deletedAt));
  }

  async restoreUser(userId: string): Promise<User> {
    const [restoredUser] = await db
      .update(users)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return restoredUser;
  }

  async getRetentionStats(): Promise<{ active: number; softDeleted: number; anonymized: number; upcomingPurge: number }> {
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);

    const [activeResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.deletedAt} IS NULL`);

    const [softDeletedResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(isNotNull(users.deletedAt), sql`${users.firstName} != 'Deleted'`));

    const [anonymizedResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(isNotNull(users.deletedAt), eq(users.firstName, "Deleted")));

    const [upcomingPurgeResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          sql`${users.deletedAt} IS NULL`,
          sql`${users.updatedAt} < ${sixYearsAgo}`,
          sql`${users.membershipStatus} != 'active'`
        )
      );

    return {
      active: activeResult?.count || 0,
      softDeleted: softDeletedResult?.count || 0,
      anonymized: anonymizedResult?.count || 0,
      upcomingPurge: upcomingPurgeResult?.count || 0,
    };
  }

  async getConsentStats(): Promise<{ optedIn: number; optedOut: number }> {
    const [optedInResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.marketingOptIn, true), sql`${users.deletedAt} IS NULL`));

    const [optedOutResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.marketingOptIn, false), sql`${users.deletedAt} IS NULL`));

    return {
      optedIn: optedInResult?.count || 0,
      optedOut: optedOutResult?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();