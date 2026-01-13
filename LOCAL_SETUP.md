# BACO Membership Platform - Local Development Setup

This guide will help you set up the project locally in Cursor after downloading from Replit.

## Prerequisites

1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL 14+** - Download from [postgresql.org](https://www.postgresql.org/download/)
3. **Git** (optional but recommended)

## Step 1: Install PostgreSQL Locally

### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Windows
1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember your password!

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE baco_dev;

# Verify it was created
\l

# Exit
\q
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/baco_dev

# Session
SESSION_SECRET=generate_a_random_32_char_string_here

# Supabase Storage (S3-compatible)
SUPABASE_STORAGE_ENDPOINT=https://ppfgonxjzuesetskxxei.storage.supabase.co/storage/v1/s3
SUPABASE_STORAGE_REGION=us-west-2
SUPABASE_STORAGE_ACCESS_KEY=your_access_key_here
SUPABASE_STORAGE_SECRET_KEY=your_secret_key_here
SUPABASE_STORAGE_BUCKET=documents

# SendGrid Email (optional for development)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@baco-bahamas.com

# Application
APP_URL=http://localhost:5000
NODE_ENV=development
PORT=5000
```

To generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Push Database Schema

This will create all the tables in your local database:
```bash
npm run db:push
```

If you get a warning about data loss (shouldn't happen on empty database), use:
```bash
npm run db:push -- --force
```

## Step 6: Import Production Data (Optional)

The `exports/` folder contains all your production data from Replit:

| File | Contents |
|------|----------|
| `users_full.csv` | 5 users (including 2 admin accounts) |
| `events_full.csv` | 2 events |
| `event_registrations_full.csv` | 188 conference registrations |

### Quick Import (Recommended)

```bash
# From the project root directory:
psql -U postgres -d baco_dev -f exports/import_data.sql
```

### Manual Import (if the above doesn't work)

```bash
# Connect to your database
psql -U postgres -d baco_dev

# Import each table
\copy users FROM 'exports/users_full.csv' WITH CSV HEADER;
\copy events FROM 'exports/events_full.csv' WITH CSV HEADER;
\copy event_registrations FROM 'exports/event_registrations_full.csv' WITH CSV HEADER;

# Verify
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM event_registrations;
```

### Alternative: Fresh Start

If you prefer to start fresh without importing data, just use the sample seed:
```bash
psql -U postgres -d baco_dev -f exports/seed_data.sql
```

## Step 7: Start the Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:5000`

## Default Login Credentials

After seeding:
- **Admin**: admin@baco.com / admin123
- (Note: Passwords are hashed, so you may need to reset them locally)

### Resetting Passwords Locally

If passwords don't work, you can add a temporary route to reset them, or update directly:

1. Create a simple script `reset-password.ts`:
```typescript
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Use this to generate a new hash
hashPassword("admin123").then(console.log);
```

2. Run it and update the database with the new hash.

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   └── auth.ts          # Authentication
├── shared/              # Shared code
│   └── schema.ts        # Database schema (Drizzle ORM)
├── exports/             # Database exports
└── .env.example         # Environment template
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio (database viewer) |

## Deploying to Vercel + Supabase

### 1. Set Up Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database > Connection string
4. Copy the connection string (use "URI" format)

### 2. Push Schema to Supabase
Update your `.env` with the Supabase connection string, then:
```bash
npm run db:push
```

### 3. Deploy to Vercel
1. Push your code to GitHub
2. Import the repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` (Supabase connection string)
   - `SESSION_SECRET` (production secret)
   - `NODE_ENV=production`
4. Deploy!

## Troubleshooting

### "ECONNREFUSED" when connecting to database
- Make sure PostgreSQL is running
- Check your connection string in `.env`
- Verify the database exists

### "relation does not exist" errors
- Run `npm run db:push` to create tables

### Password login not working
- Passwords are hashed with scrypt
- Either seed with the exported data or reset passwords locally

### Port 5000 already in use
- Kill the process: `lsof -ti:5000 | xargs kill`
- Or change PORT in `.env`

## Need Help?

The codebase uses:
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Payments**: Stripe (needs configuration)
- **File Storage**: Google Cloud Storage (needs configuration)
