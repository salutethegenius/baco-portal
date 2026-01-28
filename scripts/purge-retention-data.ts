#!/usr/bin/env ts-node
/**
 * Retention and Data Purge Script
 * 
 * This script enforces data retention policies per the Bahamas Data Protection Act.
 * It should be run periodically (e.g., monthly) via cron or scheduled task.
 * 
 * Retention rules (from DATA_INVENTORY.md):
 * - Member accounts: soft-delete after 6 years of inactivity, anonymise after 7 years
 * - Event registrations: keep for 6-7 years for audit/CPD history
 * - Financial records (payments, invoices): keep for 7+ years per tax law
 * - Documents: delete after membership ends + reasonable period unless legally required
 * - Messages: keep for up to 6 years where relevant
 * 
 * Usage:
 *   npm run purge-retention-data
 *   or
 *   ts-node scripts/purge-retention-data.ts
 */

import { db } from "../server/db";
import { users, eventRegistrations, documents, messages, payments, invoices } from "../shared/schema";
import { eq, and, sql, lt, isNotNull } from "drizzle-orm";

const RETENTION_PERIODS = {
  // Member accounts: soft-delete after 6 years of inactivity
  USER_SOFT_DELETE_DAYS: 6 * 365,
  // Anonymise after 7 years
  USER_ANONYMISE_DAYS: 7 * 365,
  // Event registrations: keep for 6 years
  EVENT_REGISTRATION_DAYS: 6 * 365,
  // Documents: delete after 5 years of inactivity (unless legally required)
  DOCUMENT_DELETE_DAYS: 5 * 365,
  // Messages: keep for 6 years
  MESSAGE_DELETE_DAYS: 6 * 365,
  // Financial records: keep for 7+ years (handled separately, not auto-deleted)
} as const;

interface PurgeStats {
  usersSoftDeleted: number;
  usersAnonymised: number;
  eventRegistrationsDeleted: number;
  documentsDeleted: number;
  messagesDeleted: number;
}

async function purgeRetentionData(): Promise<PurgeStats> {
  const stats: PurgeStats = {
    usersSoftDeleted: 0,
    usersAnonymised: 0,
    eventRegistrationsDeleted: 0,
    documentsDeleted: 0,
    messagesDeleted: 0,
  };

  const now = new Date();

  console.log(`[${now.toISOString()}] Starting retention data purge...`);

  try {
    // 1. Soft-delete inactive users (6 years of inactivity)
    const softDeleteThreshold = new Date(now.getTime() - RETENTION_PERIODS.USER_SOFT_DELETE_DAYS * 24 * 60 * 60 * 1000);
    const inactiveUsers = await db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.deletedAt} IS NULL`,
          sql`${users.updatedAt} < ${softDeleteThreshold}`,
          sql`${users.membershipStatus} != 'active'` // Only soft-delete non-active members
        )
      );

    for (const user of inactiveUsers) {
      await db
        .update(users)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));
      stats.usersSoftDeleted++;
      console.log(`  Soft-deleted inactive user: ${user.email} (last activity: ${user.updatedAt})`);
    }

    // 2. Anonymise users deleted more than 1 year ago (7 years total)
    const anonymiseThreshold = new Date(now.getTime() - RETENTION_PERIODS.USER_ANONYMISE_DAYS * 24 * 60 * 60 * 1000);
    const usersToAnonymise = await db
      .select()
      .from(users)
      .where(
        and(
          isNotNull(users.deletedAt),
          sql`${users.deletedAt} < ${anonymiseThreshold}`,
          sql`${users.firstName} != 'Deleted'` // Avoid re-anonymising
        )
      );

    for (const user of usersToAnonymise) {
      const anonymisedEmail = `deleted_${user.id.slice(0, 8)}_${Date.now()}@deleted.baco`;
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
          updatedAt: now,
        })
        .where(eq(users.id, user.id));
      stats.usersAnonymised++;
      console.log(`  Anonymised user: ${user.id} (was: ${user.email})`);
    }

    // 3. Delete old event registrations (6 years)
    const eventRegThreshold = new Date(now.getTime() - RETENTION_PERIODS.EVENT_REGISTRATION_DAYS * 24 * 60 * 60 * 1000);
    const oldRegistrations = await db
      .select()
      .from(eventRegistrations)
      .where(sql`${eventRegistrations.createdAt} < ${eventRegThreshold}`);

    for (const reg of oldRegistrations) {
      await db.delete(eventRegistrations).where(eq(eventRegistrations.id, reg.id));
      stats.eventRegistrationsDeleted++;
    }
    console.log(`  Deleted ${stats.eventRegistrationsDeleted} old event registrations`);

    // 4. Delete old documents (5 years, but keep if user is still active)
    const docThreshold = new Date(now.getTime() - RETENTION_PERIODS.DOCUMENT_DELETE_DAYS * 24 * 60 * 60 * 1000);
    const oldDocuments = await db
      .select()
      .from(documents)
      .where(sql`${documents.uploadDate} < ${docThreshold}`);

    for (const doc of oldDocuments) {
      // Check if user is still active
      const user = await db.select().from(users).where(eq(users.id, doc.userId)).limit(1);
      if (user.length === 0 || user[0].deletedAt || user[0].membershipStatus !== "active") {
        await db.delete(documents).where(eq(documents.id, doc.id));
        stats.documentsDeleted++;
      }
    }
    console.log(`  Deleted ${stats.documentsDeleted} old documents`);

    // 5. Delete old messages (6 years)
    const messageThreshold = new Date(now.getTime() - RETENTION_PERIODS.MESSAGE_DELETE_DAYS * 24 * 60 * 60 * 1000);
    const oldMessages = await db
      .select()
      .from(messages)
      .where(sql`${messages.sentAt} < ${messageThreshold}`);

    for (const msg of oldMessages) {
      await db.delete(messages).where(eq(messages.id, msg.id));
      stats.messagesDeleted++;
    }
    console.log(`  Deleted ${stats.messagesDeleted} old messages`);

    // Note: Payments and invoices are NOT auto-deleted - they must be kept for 7+ years per financial/tax law
    // These should be reviewed manually or via a separate process with legal oversight

    console.log(`[${new Date().toISOString()}] Retention purge completed. Stats:`, stats);
    return stats;
  } catch (error) {
    console.error("Error during retention purge:", error);
    throw error;
  }
}

// Run if executed directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('purge-retention-data.ts')) {
  purgeRetentionData()
    .then(() => {
      console.log("Purge script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Purge script failed:", error);
      process.exit(1);
    });
}

export { purgeRetentionData, RETENTION_PERIODS };
