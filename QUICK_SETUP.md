# Quick Setup Guide

## ✅ What I Just Fixed

1. ✅ Installed `dotenv-cli` - This allows your `.env` file to be loaded automatically
2. ✅ Updated `npm run db:push` to use dotenv-cli

## 🔧 What You Need To Do Next

### Step 1: Set Up Your Database URL

You need to update your `.env` file with a real database connection string. You have a few options:

#### Option A: Use Supabase (Recommended - Free Tier Available)

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Go to **Settings → Database**
4. Find the **Connection string** section
5. Copy the **URI** connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
6. Replace `[YOUR-PASSWORD]` with your database password
7. Paste it into your `.env` file as `DATABASE_URL`

#### Option B: Use Neon (Recommended - Free Tier Available)

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://user:password@host/dbname?sslmode=require`)
4. Paste it into your `.env` file as `DATABASE_URL`

#### Option C: Use Local PostgreSQL

1. Install PostgreSQL locally (if not already installed)
2. Create a database: `createdb baco_dev` (or use `psql` and run `CREATE DATABASE baco_dev;`)
3. Use: `DATABASE_URL=postgresql://postgres:your_password@localhost:5432/baco_dev`

### Step 2: Update Your .env File

Open your `.env` file and update at minimum:

```env
# Replace this placeholder with your actual database URL
DATABASE_URL=postgresql://user:password@host:5432/database

# Generate a random session secret (see command below)
SESSION_SECRET=your_random_secret_here

# Set to development for local work
NODE_ENV=development
```

### Step 3: Generate a Session Secret

Run this command to generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as `SESSION_SECRET` in your `.env` file.

### Step 4: Push Database Schema

Once your `DATABASE_URL` is set correctly, run:

```bash
npm run db:push
```

This will create all the tables in your database.

### Step 5: Start the Development Server

```bash
npm run dev
```

The server should start on http://localhost:5000

## 🆘 Still Having Issues?

### Error: "DATABASE_URL must be set"
- Make sure your `.env` file exists in the project root
- Check that `DATABASE_URL` doesn't have placeholder text like `host` or `your_password`
- Make sure there are no quotes around the URL in `.env`

### Error: "getaddrinfo ENOTFOUND"
- Your `DATABASE_URL` has an invalid hostname
- Double-check you copied the entire connection string correctly
- Make sure you replaced any placeholder values

### Error: "password authentication failed"
- Check your database password is correct
- Make sure you replaced `[YOUR-PASSWORD]` with the actual password

## 📝 Optional: Other Environment Variables

These are optional for basic functionality but required for full features:

```env
# For file uploads (Supabase Storage)
SUPABASE_STORAGE_ENDPOINT=https://your-project.storage.supabase.co/storage/v1/s3
SUPABASE_STORAGE_REGION=us-west-2
SUPABASE_STORAGE_ACCESS_KEY=your_key
SUPABASE_STORAGE_SECRET_KEY=your_secret
SUPABASE_STORAGE_BUCKET=documents

# For sending emails (SendGrid)
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@baco-bahamas.com

# Application URL
APP_URL=http://localhost:5000
PORT=5000
```

You can add these later - the app will work without them, but file uploads and emails won't function until configured.

