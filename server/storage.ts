import {
  users,
  events,
  eventRegistrations,
  documents,
  messages,
  payments,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, count, sql } from "drizzle-orm";
import { generateSlug, ensureUniqueSlug } from "@shared/utils";

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

  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;


  // Event registration operations
  getEventRegistrations(eventId: string): Promise<EventRegistration[]>;
  getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]>;
  getUserEventRegistration(userId: string, eventId: string): Promise<EventRegistration | undefined>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateEventRegistrationPayment(id: string, paymentStatus: string, stripePaymentIntentId?: string): Promise<EventRegistration>;

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

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllDocuments(): Promise<(Document & { user: User })[]>;
  getAllMessages(): Promise<(Message & { fromUser: User; toUser: User })[]>;
  getUserStats(): Promise<{ totalMembers: number; activeMembers: number; pendingDocuments: number; }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllUsersDetailed(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isAdmin,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
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
    try {
      // First check if event has registrations
      const registrations = await this.db
        .select()
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId));

      if (registrations.length > 0) {
        throw new Error(`Cannot delete event with ${registrations.length} existing registrations. Please contact registrants first.`);
      }

      await this.db.delete(events).where(eq(events.id, eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }



  // Event registration operations
  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }

  async findEventRegistrationByEmail(eventId: string, email: string): Promise<any> {
    const results = await this.db
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

  async createEventRegistration(data: InsertEventRegistration): Promise<EventRegistration> {
    // Create the registration
    const [registration] = await this.db
      .insert(eventRegistrations)
      .values(data)
      .returning();

    // Update event's current attendee count
    const currentCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, data.eventId));

    await this.db
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
  async getUserMessages(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)))
      .orderBy(desc(messages.sentAt));
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

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
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
    const results = await db
      .select({
        message: messages,
        fromUser: users,
        toUser: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.fromUserId, users.id))
      .innerJoin(users, eq(messages.toUserId, users.id))
      .orderBy(desc(messages.sentAt));

    return results.map(result => ({
      ...result.message,
      fromUser: result.fromUser,
      toUser: result.toUser
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
      console.log("Sample admin user created");
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
      console.log("Sample events created");
    }
  }
}

export const storage = new DatabaseStorage();