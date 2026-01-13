import 'dotenv/config';
import { pool } from './server/db.js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to convert CSV values to proper types
function convertValue(value: string, columnType: string): any {
  if (!value || value.trim() === '' || value.toLowerCase() === 'null') {
    return null;
  }

  // Handle boolean values (from CSV, 't' = true, 'f' = false, or 'true'/'false')
  if (columnType === 'boolean') {
    const lower = value.toLowerCase().trim();
    return lower === 't' || lower === 'true' || lower === '1';
  }

  // Handle timestamp/datetime values
  if (columnType === 'timestamp') {
    return value;
  }

  // Handle numeric values (decimal/integer)
  if (columnType === 'decimal' || columnType === 'integer') {
    const num = parseFloat(value);
    return isNaN(num) ? null : (columnType === 'integer' ? Math.floor(num) : value);
  }

  return value;
}

// Map CSV column names to database column names
const columnMappings: Record<string, Record<string, string>> = {
  users: {
    'id': 'id',
    'email': 'email',
    'password': 'password',
    'first_name': 'first_name',
    'last_name': 'last_name',
    'profile_image_url': 'profile_image_url',
    'phone': 'phone',
    'address': 'address',
    'membership_type': 'membership_type',
    'membership_status': 'membership_status',
    'join_date': 'join_date',
    'next_payment_date': 'next_payment_date',
    'annual_fee': 'annual_fee',
    'is_admin': 'is_admin',
    'stripe_customer_id': 'stripe_customer_id',
    'stripe_subscription_id': 'stripe_subscription_id',
    'created_at': 'created_at',
    'updated_at': 'updated_at',
    'position': 'position',
    'company': 'company',
    'business_address': 'business_address',
    'home_address': 'home_address',
    'date_of_birth': 'date_of_birth',
    'place_of_birth': 'place_of_birth',
    'nationality': 'nationality',
    'bahamas_resident': 'bahamas_resident',
    'years_in_bahamas': 'years_in_bahamas',
    'qualification': 'qualification',
    'institution': 'institution',
    'graduation_year': 'graduation_year',
    'current_employer': 'current_employer',
    'years_experience': 'years_experience',
    'is_existing_member': 'is_existing_member',
    'membership_number': 'membership_number',
  },
  events: {
    'id': 'id',
    'title': 'title',
    'description': 'description',
    'start_date': 'start_date',
    'end_date': 'end_date',
    'location': 'location',
    'price': 'price',
    'max_attendees': 'max_attendees',
    'current_attendees': 'current_attendees',
    'status': 'status',
    'created_by': 'created_by',
    'created_at': 'created_at',
    'updated_at': 'updated_at',
    'slug': 'slug',
    'is_public': 'is_public',
    'member_price': 'member_price',
    'non_member_price': 'non_member_price',
    'registration_closed': 'registration_closed',
  },
  event_registrations: {
    'id': 'id',
    'event_id': 'event_id',
    'user_id': 'user_id',
    'registration_date': 'registration_date',
    'payment_status': 'payment_status',
    'payment_amount': 'payment_amount',
    'stripe_payment_intent_id': 'stripe_payment_intent_id',
    'created_at': 'created_at',
    'first_name': 'first_name',
    'last_name': 'last_name',
    'email': 'email',
    'position': 'position',
    'phone_number': 'phone_number',
    'notes': 'notes',
    'registration_type': 'registration_type',
    'payment_method': 'payment_method',
    'company_name': 'company_name',
    'membership_type': 'membership_type',
    'is_paid': 'is_paid',
    'payment_method_tracking': 'payment_method_tracking',
    'cros': 'cros',
    'admin_notes': 'admin_notes',
  },
};

// Column types for conversion
const columnTypes: Record<string, Record<string, string>> = {
  users: {
    'is_admin': 'boolean',
    'bahamas_resident': 'boolean',
    'is_existing_member': 'boolean',
    'join_date': 'timestamp',
    'next_payment_date': 'timestamp',
    'date_of_birth': 'timestamp',
    'created_at': 'timestamp',
    'updated_at': 'timestamp',
    'annual_fee': 'decimal',
    'years_in_bahamas': 'integer',
    'graduation_year': 'integer',
    'years_experience': 'integer',
  },
  events: {
    'is_public': 'boolean',
    'registration_closed': 'boolean',
    'start_date': 'timestamp',
    'end_date': 'timestamp',
    'created_at': 'timestamp',
    'updated_at': 'timestamp',
    'price': 'decimal',
    'member_price': 'decimal',
    'non_member_price': 'decimal',
    'max_attendees': 'integer',
    'current_attendees': 'integer',
  },
  event_registrations: {
    'is_paid': 'boolean',
    'registration_date': 'timestamp',
    'created_at': 'timestamp',
    'payment_amount': 'decimal',
  },
};

async function getUserIDByEmail(email: string): Promise<string | null> {
  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  return result.rows.length > 0 ? result.rows[0].id : null;
}

async function getUserIDFromCSV(csvUserId: string): Promise<string | null> {
  // First check if the ID exists in the database
  const result = await pool.query('SELECT id FROM users WHERE id = $1', [csvUserId]);
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  return null;
}

async function importCSV(tableName: string, csvFile: string) {
  console.log(`\n📄 Reading ${csvFile}...`);
  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  
  console.log(`📊 Parsing CSV for ${tableName}...`);
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`✅ Found ${records.length} records to import`);

  if (records.length === 0) {
    console.log(`⚠️  No records found in ${csvFile}, skipping...`);
    return;
  }

  const mapping = columnMappings[tableName];
  const types = columnTypes[tableName] || {};
  
  // Get columns from mapping (only include columns that exist in mapping)
  const columns = Object.keys(records[0]).filter(col => mapping[col]);
  const dbColumns = columns.map(col => mapping[col]);
  
  console.log(`📋 Importing columns: ${dbColumns.join(', ')}`);

  // For events, create a cache of user IDs from CSV email mapping
  const userIdCache: Record<string, string> = {};
  if (tableName === 'events') {
    console.log(`  🔍 Building user ID cache for foreign key resolution...`);
    // Read users CSV to map emails to IDs
    const usersCsv = fs.readFileSync(path.join(__dirname, 'exports', 'users_full.csv'), 'utf-8');
    const userRecords = parse(usersCsv, { columns: true, skip_empty_lines: true, trim: true });
    for (const userRecord of userRecords) {
      const email = userRecord.email;
      if (email) {
        // Try to get the actual ID from database
        const actualId = await getUserIDByEmail(email);
        if (actualId) {
          userIdCache[userRecord.id] = actualId; // Map CSV ID to actual DB ID
        }
      }
    }
  }

  let successCount = 0;
  let errorCount = 0;

  // Process in batches for better performance
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(records.length / batchSize);
    
    console.log(`  Processing batch ${batchNum}/${totalBatches} (${batch.length} records)...`);

    for (const record of batch) {
      try {
        const values: any[] = [];
        const placeholders: string[] = [];
        const setClauses: string[] = [];

        // Build INSERT ... ON CONFLICT DO UPDATE SET query
        let conflictTarget = 'id';
        let excludeFromUpdate: string[] = ['id'];
        
        // For users table, use email as conflict target and exclude id from updates
        if (tableName === 'users') {
          conflictTarget = 'email';
          excludeFromUpdate = ['id']; // Don't update ID when email conflicts
        }

        for (const csvCol of columns) {
          const dbCol = mapping[csvCol];
          let value = convertValue(record[csvCol] || '', types[dbCol] || 'string');
          
          // For events table, if this is created_by field, resolve the user ID
          if (tableName === 'events' && dbCol === 'created_by' && value) {
            const csvUserId = value as string;
            const cachedUserId = userIdCache[csvUserId];
            const actualUserId = cachedUserId || await getUserIDFromCSV(csvUserId);
            if (actualUserId) {
              value = actualUserId;
            } else {
              // If we can't find the user, skip this record
              throw new Error(`User ID ${csvUserId} not found in database`);
            }
          }
          
          values.push(value);
          placeholders.push(`$${values.length}`);
          
          // For ON CONFLICT UPDATE, set all columns except excluded ones
          if (!excludeFromUpdate.includes(dbCol)) {
            setClauses.push(`${dbCol} = $${values.length}`);
          }
        }

        const insertQuery = `
          INSERT INTO ${tableName} (${dbColumns.join(', ')})
          VALUES (${placeholders.join(', ')})
          ON CONFLICT (${conflictTarget}) DO UPDATE SET
            ${setClauses.join(', ')}
        `;

        await pool.query(insertQuery, values);
        successCount++;
      } catch (error: any) {
        errorCount++;
        if (errorCount <= 5) { // Only show first 5 errors to avoid spam
          console.error(`  ❌ Error importing record: ${error.message}`);
          if (errorCount === 5) {
            console.error(`  ... (suppressing further errors)`);
          }
        }
      }
    }
  }

  console.log(`\n✅ ${tableName}: ${successCount} records imported successfully`);
  if (errorCount > 0) {
    console.log(`⚠️  ${tableName}: ${errorCount} records failed to import`);
  }
}

async function importData() {
  console.log('🚀 Starting CSV data import into Supabase...\n');
  console.log('=' .repeat(60));

  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Import in order (users first, then events, then registrations)
    await importCSV('users', path.join(__dirname, 'exports', 'users_full.csv'));
    await importCSV('events', path.join(__dirname, 'exports', 'events_full.csv'));
    await importCSV('event_registrations', path.join(__dirname, 'exports', 'event_registrations_full.csv'));

    console.log('\n' + '='.repeat(60));
    console.log('✅ All imports complete!\n');

    // Verify imports
    console.log('📊 Verifying imports...');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
    const registrationsCount = await pool.query('SELECT COUNT(*) FROM event_registrations');
    const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE is_admin = true");

    console.log(`\n📈 Final counts:`);
    console.log(`   Users: ${usersCount.rows[0].count}`);
    console.log(`   Events: ${eventsCount.rows[0].count}`);
    console.log(`   Event Registrations: ${registrationsCount.rows[0].count}`);
    console.log(`   Admin Users: ${adminCount.rows[0].count}`);

    console.log('\n👤 Admin accounts:');
    const adminUsers = await pool.query(`
      SELECT email, first_name, last_name, is_admin 
      FROM users 
      WHERE is_admin = true
    `);
    adminUsers.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.first_name} ${user.last_name})`);
    });

  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importData();

