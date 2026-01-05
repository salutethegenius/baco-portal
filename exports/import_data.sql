-- BACO Database Import Script
-- Run this after creating your local database and running npm run db:push
-- 
-- Usage:
--   psql -U postgres -d baco_dev -f exports/import_data.sql
--
-- Or from inside psql:
--   \i exports/import_data.sql

-- Disable foreign key checks temporarily for clean import
SET session_replication_role = replica;

-- Clear existing data (optional - uncomment if needed)
-- TRUNCATE event_registrations, payments, documents, messages, events, users CASCADE;

-- Import Users
\echo 'Importing users...'
\copy users FROM 'exports/users_full.csv' WITH CSV HEADER;

-- Import Events
\echo 'Importing events...'
\copy events FROM 'exports/events_full.csv' WITH CSV HEADER;

-- Import Event Registrations
\echo 'Importing event registrations...'
\copy event_registrations FROM 'exports/event_registrations_full.csv' WITH CSV HEADER;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify import
\echo ''
\echo '=== Import Complete ==='
\echo ''
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Registrations', COUNT(*) FROM event_registrations;

\echo ''
\echo 'Admin accounts available:'
SELECT email, first_name, last_name, is_admin FROM users WHERE is_admin = true;
