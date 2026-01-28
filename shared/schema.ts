import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
// Data classification: technical session data (low risk, no direct PII beyond identifiers in JSON payload).
// Typical retention: short-lived, only for active sessions and operational troubleshooting.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication and member management
// Data classification: high – includes identity, contact, membership, limited background/professional data and credentials (hashed).
// Retention (baseline): lifetime of membership + ~6 years after last activity, subject to legal/audit needs (see DATA_INVENTORY.md).
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  address: text("address"),

  // Membership fields
  membershipType: varchar("membership_type").default("professional"),
  membershipStatus: varchar("membership_status").default("pending"),
  joinDate: timestamp("join_date").defaultNow(),
  nextPaymentDate: timestamp("next_payment_date"),
  annualFee: decimal("annual_fee", { precision: 10, scale: 2 }).default("350.00"),

  // Additional BACO registration fields
  position: varchar("position"),
  company: varchar("company"),
  businessAddress: text("business_address"),
  homeAddress: text("home_address"),
  dateOfBirth: timestamp("date_of_birth"),
  placeOfBirth: varchar("place_of_birth"),
  nationality: varchar("nationality"),
  bahamasResident: boolean("bahamas_resident").default(false),
  yearsInBahamas: integer("years_in_bahamas"),
  qualification: varchar("qualification"),
  institution: varchar("institution"),
  graduationYear: integer("graduation_year"),
  currentEmployer: varchar("current_employer"),
  yearsExperience: integer("years_experience"),
  isExistingMember: boolean("is_existing_member").default(false),
  membershipNumber: varchar("membership_number"),

  // Preferences
  marketingOptIn: boolean("marketing_opt_in").default(true),

  // System fields
  isAdmin: boolean("is_admin").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp for retention compliance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
// Data classification: low/medium – event metadata, no sensitive personal data.
// Retention: keep as long as historically useful for CPD/records; can be archived rather than deleted.
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: varchar("location"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  memberPrice: decimal("member_price", { precision: 10, scale: 2 }),
  nonMemberPrice: decimal("non_member_price", { precision: 10, scale: 2 }),
  maxAttendees: integer("max_attendees"),
  currentAttendees: integer("current_attendees").default(0),
  status: varchar("status").default("upcoming"), // upcoming, ongoing, completed, cancelled
  isPublic: boolean("is_public").default(true),
  registrationClosed: boolean("registration_closed").default(false),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event registrations table
// Data classification: medium – attendee identity and contact details, registration choices, payment metadata (no card numbers).
// Retention: generally align with events and financial records (~6–7 years) for audit and CPD history.
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  userId: varchar("user_id").references(() => users.id), // Optional for public registrations
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  companyName: varchar("company_name"),
  position: varchar("position"),
  phoneNumber: varchar("phone_number"),
  notes: text("notes"),
  registrationType: varchar("registration_type"), // "member_two_day", "non_member_one_day", "non_member_two_day"
  paymentMethod: varchar("payment_method"), // "paylanes", "bank_transfer", "cheque"
  registrationDate: timestamp("registration_date").defaultNow(),
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, failed
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  
  // Admin management fields
  membershipType: varchar("membership_type"), // "member", "non_member" - editable by admin
  isPaid: boolean("is_paid").default(false), // Admin toggle for payment status
  paymentMethodTracking: varchar("payment_method_tracking"), // Actual payment method used (Direct DP, Cash, etc.)
  cros: text("cros"), // Admin field for CROS tracking
  adminNotes: text("admin_notes"), // Additional admin notes
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents table
// Data classification: high – uploaded certifications, IDs, receipts and other supporting documents; may contain sensitive data.
// Retention: only as long as needed to evidence membership/CPD and comply with legal obligations, then delete or anonymise.
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type"),
  fileSize: integer("file_size"),
  objectPath: varchar("object_path").notNull(),
  category: varchar("category"), // certificate, id, receipt, other
  status: varchar("status").default("pending"), // pending, approved, rejected
  uploadDate: timestamp("upload_date").defaultNow(),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
// Data classification: medium – structured communications between members and admins; may include limited personal details.
// Retention: keep for a reasonable period (e.g. up to 6 years) where relevant to membership, complaints or audit.
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  subject: varchar("subject"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Payments table
// Data classification: high – financial transaction metadata (amounts, currency, status); no full card numbers are stored.
// Retention: at least 7 years or as required under Bahamian financial and tax law.
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("BSD"),
  type: varchar("type").notNull(), // membership, event, other
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  eventId: varchar("event_id").references(() => events.id),
  paymentDate: timestamp("payment_date").defaultNow(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Certificate templates table
// Data classification: low – template configuration and design assets (no member PII).
// Retention: as long as templates remain in use; can be archived when superseded.
export const certificateTemplates = pgTable("certificate_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  templateImagePath: varchar("template_image_path").notNull(),
  // Text positioning config (JSON with x, y, fontSize, color for each field)
  textConfig: jsonb("text_config"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices table
// Data classification: high – billing contact data and invoice metadata linked to members.
// Retention: at least 7 years or longer if required by financial/tax regulations.
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  memberName: varchar("member_name").notNull(),
  memberEmail: varchar("member_email").notNull(),
  placeOfEmployment: varchar("place_of_employment"),
  companyName: varchar("company_name"),
  companyEmail: varchar("company_email"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  status: varchar("status").default("generated"), // generated, sent, paid
  pdfPath: varchar("pdf_path"),
  generatedBy: varchar("generated_by").references(() => users.id),
  isAdminGenerated: boolean("is_admin_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs table for compliance tracking
// Data classification: medium – contains action logs, user IDs, and metadata for audit purposes.
// Retention: keep for 7+ years per audit/compliance requirements.
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  event: varchar("event").notNull(),
  userId: varchar("user_id").references(() => users.id), // User who performed action
  targetUserId: varchar("target_user_id").references(() => users.id), // User affected (if applicable)
  details: text("details"), // JSON stringified details
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_audit_logs_event").on(table.event),
  index("IDX_audit_logs_user_id").on(table.userId),
  index("IDX_audit_logs_created_at").on(table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  payments: many(payments),
  eventRegistrations: many(eventRegistrations),
  createdEvents: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  registrations: many(eventRegistrations),
  payments: many(payments),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [documents.verifiedBy],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  fromUser: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  toUser: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [payments.eventId],
    references: [events.id],
  }),
}));

export const certificateTemplatesRelations = relations(certificateTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [certificateTemplates.createdBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  generator: one(users, {
    fields: [invoices.generatedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  currentAttendees: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  registrationDate: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
  verifiedAt: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  sentAt: true,
  readAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  paymentDate: true,
  createdAt: true,
});

export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

// Admin update schema for event registrations
export const updateEventRegistrationAdminSchema = z.object({
  membershipType: z.enum(["member", "non_member"]).optional(),
  isPaid: z.boolean().optional(),
  paymentMethodTracking: z.enum(["paylanes", "direct_deposit", "cash", "cheque", "bank_transfer"]).optional(),
  cros: z.string().optional(),
  adminNotes: z.string().optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertCertificateTemplate = z.infer<typeof insertCertificateTemplateSchema>;
export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;