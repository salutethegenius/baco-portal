
import { Client } from 'pg';

async function removeFlyerColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if columns exist before dropping them
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name IN ('flyer_image_url', 'flyer_object_path')
    `);

    if (checkColumns.rows.length > 0) {
      console.log('Removing flyer columns from events table...');
      await client.query(`
        ALTER TABLE events 
        DROP COLUMN IF EXISTS flyer_image_url,
        DROP COLUMN IF EXISTS flyer_object_path
      `);
      console.log('Successfully removed flyer columns from events table');
    } else {
      console.log('Flyer columns do not exist or already removed');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

removeFlyerColumns()
  .then(() => {
    console.log('Flyer columns removal completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
