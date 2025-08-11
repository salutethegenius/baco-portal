
import { Client } from 'pg';

async function migrateFlyerColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name IN ('flyer_image_url', 'flyer_object_path')
    `);

    if (checkColumns.rows.length === 0) {
      // Add the missing columns
      await client.query(`
        ALTER TABLE events 
        ADD COLUMN flyer_image_url varchar,
        ADD COLUMN flyer_object_path varchar
      `);
      console.log('Successfully added flyer columns to events table');
    } else {
      console.log('Flyer columns already exist');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrateFlyerColumns()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
