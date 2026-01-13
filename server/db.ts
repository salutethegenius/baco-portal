import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check for DATABASE_URL with better error messaging
if (!process.env.DATABASE_URL) {
  // Debug: Log available env vars to help troubleshoot
  console.error('=== DATABASE_URL Missing Debug Info ===');
  console.error('NODE_ENV:', process.env.NODE_ENV);
  console.error('All env vars with "DATABASE" in name:', 
    Object.keys(process.env).filter(k => k.toUpperCase().includes('DATABASE')));
  console.error('All env vars with "DB" in name:', 
    Object.keys(process.env).filter(k => k.toUpperCase().includes('DB')));
  console.error('Total env vars:', Object.keys(process.env).length);
  console.error('========================================');
  
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database? " +
    "Check Railway service Variables tab (not Project Settings)."
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });