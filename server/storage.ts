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
import { eq, desc, and, or, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserMembershipStatus(userId: string, status: string, nextPaymentDate?: Date): Promise<User>;
  
  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  
  // Event registration operations
  getEventRegistrations(eventId: string): Promise<EventRegistration[]>;
  getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]>;
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
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Event registration operations
  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }

  async getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]> {
    return await db
      .select()
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.userId, userId))
      .orderBy(desc(events.startDate));
  }

  async createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration> {
    const [newRegistration] = await db.insert(eventRegistrations).values(registration).returning();
    
    // Update event attendee count
    await db
      .update(events)
      .set({ 
        currentAttendees: db.raw(`COALESCE(current_attendees, 0) + 1`),
        updatedAt: new Date()
      })
      .where(eq(events.id, registration.eventId));
    
    return newRegistration;
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
    return await db
      .select()
      .from(documents)
      .innerJoin(users, eq(documents.userId, users.id))
      .orderBy(desc(documents.uploadDate));
  }

  async getAllMessages(): Promise<(Message & { fromUser: User; toUser: User })[]> {
    return await db
      .select()
      .from(messages)
      .innerJoin(users, eq(messages.fromUserId, users.id))
      .innerJoin(users, eq(messages.toUserId, users.id))
      .orderBy(desc(messages.sentAt));
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
}

export const storage = new DatabaseStorage();
