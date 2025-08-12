
import { Client } from 'pg';

async function migrateMissingColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check and add missing columns to events table
    const checkEventsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name IN ('member_price', 'non_member_price')
    `);

    if (checkEventsColumns.rows.length < 2) {
      console.log('Adding missing member_price and non_member_price columns to events table...');
      await client.query(`
        ALTER TABLE events 
        ADD COLUMN IF NOT EXISTS member_price varchar,
        ADD COLUMN IF NOT EXISTS non_member_price varchar
      `);
      console.log('Successfully added member pricing columns to events table');
    } else {
      console.log('Member pricing columns already exist in events table');
    }

    // Check and add missing columns to event_registrations table
    const checkRegistrationsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event_registrations' 
      AND column_name IN ('registration_type', 'payment_method', 'payment_amount')
    `);

    if (checkRegistrationsColumns.rows.length < 3) {
      console.log('Adding missing columns to event_registrations table...');
      await client.query(`
        ALTER TABLE event_registrations 
        ADD COLUMN IF NOT EXISTS registration_type varchar,
        ADD COLUMN IF NOT EXISTS payment_method varchar,
        ADD COLUMN IF NOT EXISTS payment_amount varchar
      `);
      console.log('Successfully added registration columns to event_registrations table');
    } else {
      console.log('Registration columns already exist in event_registrations table');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrateMissingColumns()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
